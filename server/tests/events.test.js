const express = require('express');
const request = require('supertest');
const realApp = require('../src/app');
const eventRoutes = require('../src/routes/eventRoutes');
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

const addUser = (email, role) =>
  db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid;

let parent, otherParent, linkedSpecialist, unlinkedSpecialist, childUser, childId;

beforeAll(() => {
  parent = { id: addUser('parent@example.com', 'parent'), role: 'parent' };
  otherParent = { id: addUser('other-parent@example.com', 'parent'), role: 'parent' };
  linkedSpecialist = { id: addUser('linked@example.com', 'specialist'), role: 'specialist' };
  unlinkedSpecialist = { id: addUser('unlinked@example.com', 'specialist'), role: 'specialist' };
  childUser = { id: addUser('child@example.com', 'child'), role: 'child' };
  childId = db
    .prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)')
    .run(parent.id, childUser.id, 'Child').lastInsertRowid;
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')")
    .run(childId, linkedSpecialist.id);
});

const validEvent = { title: 'Swimming class', startAt: '2026-11-09 16:00', endAt: '2026-11-09 17:00' };
const eventCount = () => db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
const post = (user, body, id = childId) => request(appAs(user)).post(`/api/children/${id}/events`).send(body);

describe('POST /api/children/:id/events', () => {
  test('is closed (401) when no user is set, through the real app', async () => {
    const before = eventCount();
    const res = await request(realApp).post(`/api/children/${childId}/events`).send(validEvent);
    expect(res.status).toBe(401);
    expect(eventCount()).toBe(before);
  });

  test('the parent of the child can add an event', async () => {
    const res = await post(parent, validEvent);
    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({ childId, createdBy: parent.id, ...validEvent });
    expect(db.prepare('SELECT title FROM events WHERE id = ?').get(res.body.event.id).title).toBe('Swimming class');
  });

  test('a linked specialist can add an event', async () => {
    const res = await post(linkedSpecialist, validEvent);
    expect(res.status).toBe(201);
    expect(res.body.event.createdBy).toBe(linkedSpecialist.id);
  });

  test('accepts the datetime-local format and stores it with a space', async () => {
    const res = await post(parent, { ...validEvent, startAt: '2026-11-10T09:30', endAt: '2026-11-10T10:00' });
    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({ startAt: '2026-11-10 09:30', endAt: '2026-11-10 10:00' });
  });

  test.each([
    ['a child account', () => childUser],
    ['an unlinked specialist', () => unlinkedSpecialist],
    ["another family's parent", () => otherParent],
  ])('rejects %s with 403 and saves nothing', async (_name, getUser) => {
    const before = eventCount();
    const res = await post(getUser(), validEvent);
    expect(res.status).toBe(403);
    expect(eventCount()).toBe(before);
  });

  test('rejects an unknown or invalid child id with 403', async () => {
    expect((await post(parent, validEvent, 9999)).status).toBe(403);
    expect((await post(parent, validEvent, 'abc')).status).toBe(403);
  });

  test.each([
    ['missing title', { ...validEvent, title: undefined }],
    ['blank title', { ...validEvent, title: '   ' }],
    ['missing start', { ...validEvent, startAt: undefined }],
    ['missing end', { ...validEvent, endAt: undefined }],
    ['end before start', { ...validEvent, endAt: '2026-11-09 15:00' }],
    ['end equal to start', { ...validEvent, endAt: '2026-11-09 16:00' }],
    ['impossible date', { ...validEvent, startAt: '2026-02-30 10:00', endAt: '2026-02-30 11:00' }],
    ['impossible time', { ...validEvent, startAt: '2026-11-09 24:00' }],
    ['wrong format', { ...validEvent, startAt: '09/11/2026 16:00' }],
  ])('rejects %s with 400 and saves nothing', async (_name, body) => {
    const before = eventCount();
    const res = await post(parent, body);
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(eventCount()).toBe(before);
  });

  test('rejects an empty request body with 400', async () => {
    const res = await request(appAs(parent)).post(`/api/children/${childId}/events`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/children/:id/events?week=', () => {
  const insertEvent = (cid, createdBy, title, startAt, endAt) =>
    db.prepare('INSERT INTO events (child_id, created_by, title, start_at, end_at) VALUES (?, ?, ?, ?, ?)')
      .run(cid, createdBy, title, startAt, endAt);
  const get = (user, query = '', id = childId) => request(appAs(user)).get(`/api/children/${id}/events${query}`);
  const titles = (res) => res.body.events.map((e) => e.title);

  let otherChildId;

  beforeAll(() => {
    // Week of Monday 2026-12-07 to Sunday 2026-12-13. Inserted out of order on purpose.
    insertEvent(childId, parent.id, 'Late', '2026-12-09 15:00', '2026-12-09 16:00');
    insertEvent(childId, parent.id, 'Early', '2026-12-09 09:00', '2026-12-09 10:00');
    insertEvent(childId, parent.id, 'Sunday night', '2026-12-13 23:30', '2026-12-13 23:59');
    insertEvent(childId, parent.id, 'Monday start', '2026-12-07 00:00', '2026-12-07 01:00');
    // Outside that week: the Sunday before and the Monday after.
    insertEvent(childId, parent.id, 'Previous Sunday', '2026-12-06 23:00', '2026-12-06 23:30');
    insertEvent(childId, parent.id, 'Next Monday', '2026-12-14 00:00', '2026-12-14 01:00');

    const otherChildUser = addUser('other-child@example.com', 'child');
    otherChildId = db
      .prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)')
      .run(otherParent.id, otherChildUser, 'Other child').lastInsertRowid;
    insertEvent(otherChildId, otherParent.id, "Other child's event", '2026-12-09 12:00', '2026-12-09 13:00');
  });

  test('is closed (401) when no user is set, through the real app', async () => {
    const res = await request(realApp).get(`/api/children/${childId}/events?week=2026-12-09`);
    expect(res.status).toBe(401);
  });

  test('returns only the events of that Monday to Sunday week, ordered by date and time', async () => {
    const res = await get(parent, '?week=2026-12-10');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ weekStart: '2026-12-07', weekEnd: '2026-12-13' });
    expect(titles(res)).toEqual(['Monday start', 'Early', 'Late', 'Sunday night']);
    expect(res.body.events[1]).toMatchObject({ childId, startAt: '2026-12-09 09:00', endAt: '2026-12-09 10:00' });
  });

  test('gives the same week for any day in it', async () => {
    for (const day of ['2026-12-07', '2026-12-13']) {
      const res = await get(parent, `?week=${day}`);
      expect(res.body.weekStart).toBe('2026-12-07');
      expect(titles(res)).toEqual(['Monday start', 'Early', 'Late', 'Sunday night']);
    }
  });

  test('a week that ends in the next year', async () => {
    const res = await get(parent, '?week=2026-12-31');
    expect(res.body).toMatchObject({ weekStart: '2026-12-28', weekEnd: '2027-01-03', events: [] });
  });

  test("does not return another child's events", async () => {
    const res = await get(parent, '?week=2026-12-09');
    expect(titles(res)).not.toContain("Other child's event");
  });

  test('defaults to the current week', async () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    insertEvent(childId, parent.id, 'Today event', `${day} 12:00`, `${day} 12:30`);
    const res = await get(parent);
    expect(res.status).toBe(200);
    expect(titles(res)).toContain('Today event');
  });

  test('a linked specialist can read the week', async () => {
    const res = await get(linkedSpecialist, '?week=2026-12-09');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(4);
  });

  test.each([
    ['a child account', () => childUser],
    ['an unlinked specialist', () => unlinkedSpecialist],
    ["another family's parent", () => otherParent],
  ])('rejects %s with 403 and no data', async (_name, getUser) => {
    const res = await get(getUser(), '?week=2026-12-09');
    expect(res.status).toBe(403);
    expect(res.body.events).toBeUndefined();
  });

  test('rejects an unknown child id with 403', async () => {
    expect((await get(parent, '?week=2026-12-09', 9999)).status).toBe(403);
  });

  test.each([
    ['not a date', '?week=abc'],
    ['impossible date', '?week=2026-02-30'],
    ['empty value', '?week='],
    ['wrong format', '?week=09/12/2026'],
  ])('rejects %s with 400', async (_name, query) => {
    const res = await get(parent, query);
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
