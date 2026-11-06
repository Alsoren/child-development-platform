const express = require('express');
const request = require('supertest');
const realApp = require('../src/app');
const eventRoutes = require('../src/routes/eventRoutes');
const eventService = require('../src/services/eventService');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB

// The authenticate middleware (SCRUM-41) is not merged yet, so these tests set req.user by hand.
const appAs = (user) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use('/api/children', eventRoutes);
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
  return app;
};

const addUser = (email, role) => ({
  id: db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid,
  role,
});
const addChild = (parentId, userId, name) =>
  db.prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)').run(parentId, userId, name).lastInsertRowid;
const addEvent = (childId, createdBy, title, startAt, endAt) =>
  db.prepare('INSERT INTO events (child_id, created_by, title, start_at, end_at) VALUES (?, ?, ?, ?, ?)')
    .run(childId, createdBy, title, startAt, endAt);

// A fixed "now" far in the future, so the data does not depend on the real clock.
const NOW = '2090-03-10 12:00';
const titles = (result) => result.events.map((e) => e.title);

let parent, otherParent, linkedSpecialist, unlinkedSpecialist, child, rivalChild, childId, rivalChildId;

beforeAll(() => {
  parent = addUser('parent@example.com', 'parent');
  otherParent = addUser('other-parent@example.com', 'parent');
  linkedSpecialist = addUser('linked@example.com', 'specialist');
  unlinkedSpecialist = addUser('unlinked@example.com', 'specialist');
  child = addUser('child@example.com', 'child');
  rivalChild = addUser('rival-child@example.com', 'child');
  childId = addChild(parent.id, child.id, 'Child');
  rivalChildId = addChild(otherParent.id, rivalChild.id, 'Rival child');
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')")
    .run(childId, linkedSpecialist.id);

  // Inserted out of order on purpose.
  addEvent(childId, parent.id, 'Later', '2090-03-12 09:00', '2090-03-12 10:00');
  addEvent(childId, parent.id, 'Ancient', '2020-01-01 10:00', '2020-01-01 11:00');
  addEvent(childId, parent.id, 'Soon', '2090-03-10 15:00', '2090-03-10 16:00');
  addEvent(childId, parent.id, 'Ended today', '2090-03-10 09:00', '2090-03-10 10:00');
  addEvent(childId, parent.id, 'Ongoing', '2090-03-10 11:30', '2090-03-10 12:30');
  addEvent(rivalChildId, otherParent.id, "Rival's event", '2090-03-11 10:00', '2090-03-11 11:00');
});

describe('listUpcoming (service, fixed now)', () => {
  test('returns events that have not ended, soonest first', () => {
    expect(titles(eventService.listUpcoming(child, childId, NOW))).toEqual(['Ongoing', 'Soon', 'Later']);
  });

  test('the child, the parent and a linked specialist see the same list', () => {
    const expected = titles(eventService.listUpcoming(child, childId, NOW));
    expect(titles(eventService.listUpcoming(parent, childId, NOW))).toEqual(expected);
    expect(titles(eventService.listUpcoming(linkedSpecialist, childId, NOW))).toEqual(expected);
  });

  test("never includes another child's events", () => {
    expect(titles(eventService.listUpcoming(rivalChild, rivalChildId, NOW))).toEqual(["Rival's event"]);
  });

  test('returns at most 20 events', () => {
    for (let i = 1; i <= 25; i += 1) {
      const day = String(i).padStart(2, '0');
      addEvent(rivalChildId, otherParent.id, `Event ${day}`, `2095-02-${day} 10:00`, `2095-02-${day} 11:00`);
    }
    const result = eventService.listUpcoming(otherParent, rivalChildId, '2095-01-01 00:00');
    expect(result.events).toHaveLength(20);
    expect(result.events[0].title).toBe('Event 01');
    expect(result.events[19].title).toBe('Event 20');
  });
});

describe('GET /api/children/:id/events/upcoming', () => {
  const get = (user, id = childId) => request(appAs(user)).get(`/api/children/${id}/events/upcoming`);

  test('is closed (401) when no user is set, through the real app', async () => {
    const res = await request(realApp).get(`/api/children/${childId}/events/upcoming`);
    expect(res.status).toBe(401);
  });

  test('a child sees the upcoming events of their own schedule', async () => {
    const res = await get(child);
    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(expect.arrayContaining(['Soon', 'Later']));
    expect(titles(res.body)).not.toContain('Ancient');
    expect(titles(res.body)).not.toContain("Rival's event");
    expect(res.body.events[0]).toMatchObject({ childId, title: expect.any(String), startAt: expect.any(String) });
  });

  test('the parent and a linked specialist can read the list', async () => {
    expect((await get(parent)).status).toBe(200);
    expect((await get(linkedSpecialist)).status).toBe(200);
  });

  test("another child's account sees only their own schedule", async () => {
    const own = await get(rivalChild, rivalChildId);
    expect(own.status).toBe(200);
    expect(titles(own.body)).toContain("Rival's event");
    expect(titles(own.body)).not.toContain('Later');
  });

  test.each([
    ["another child's account", () => rivalChild],
    ['an unlinked specialist', () => unlinkedSpecialist],
    ["another family's parent", () => otherParent],
  ])('rejects %s with 403 and no data', async (_name, getUser) => {
    const res = await get(getUser());
    expect(res.status).toBe(403);
    expect(res.body.events).toBeUndefined();
  });

  test('rejects an unknown or invalid child id with 403', async () => {
    expect((await get(child, 9999)).status).toBe(403);
    expect((await get(child, 'abc')).status).toBe(403);
  });

  test('the weekly view stays closed to the child account', async () => {
    const res = await request(appAs(child)).get(`/api/children/${childId}/events?week=2090-03-10`);
    expect(res.status).toBe(403);
  });
});
