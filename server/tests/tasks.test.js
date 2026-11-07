const express = require('express');
const request = require('supertest');
const realApp = require('../src/app');
const taskRoutes = require('../src/routes/taskRoutes');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB

// The authenticate middleware (SCRUM-41) is not merged yet, so these tests set req.user by hand.
const appAs = (user) => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use('/api/children', taskRoutes);
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
  return app;
};

const addUser = (email, role) =>
  db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid;

const addChild = (parentId, childUserId, name) =>
  db.prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)').run(parentId, childUserId, name).lastInsertRowid;

// Direct insert, so tests can choose the due date and the assigner.
const addTask = (forChildId, assignedBy, title, dueDate) =>
  db
    .prepare("INSERT INTO tasks (child_id, assigned_by, title, development_area, due_date) VALUES (?, ?, ?, 'Language', ?)")
    .run(forChildId, assignedBy, title, dueDate).lastInsertRowid;

const statusOf = (taskId) => db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId).status;

let parent, otherParent, linkedSpecialist, unlinkedSpecialist, childUser, childId;
let childBUser, childBId, otherChildUser, otherChildId;

beforeAll(() => {
  parent = { id: addUser('parent@example.com', 'parent'), role: 'parent' };
  otherParent = { id: addUser('other-parent@example.com', 'parent'), role: 'parent' };
  linkedSpecialist = { id: addUser('linked@example.com', 'specialist'), role: 'specialist' };
  unlinkedSpecialist = { id: addUser('unlinked@example.com', 'specialist'), role: 'specialist' };
  childUser = { id: addUser('child@example.com', 'child'), role: 'child' };
  childId = addChild(parent.id, childUser.id, 'Child');
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')")
    .run(childId, linkedSpecialist.id);

  // A second child of the same parent (own login, same linked specialist) for the list and complete tests.
  childBUser = { id: addUser('child-b@example.com', 'child'), role: 'child' };
  childBId = addChild(parent.id, childBUser.id, 'Child B');
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')")
    .run(childBId, linkedSpecialist.id);

  // A child of another family.
  otherChildUser = { id: addUser('other-child@example.com', 'child'), role: 'child' };
  otherChildId = addChild(otherParent.id, otherChildUser.id, 'Other child');
});

const validTask = {
  title: 'Read a picture book',
  description: 'Ten minutes',
  developmentArea: 'Language',
  dueDate: '2026-11-12',
};
const taskCount = () => db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
const post = (user, body, id = childId) => request(appAs(user)).post(`/api/children/${id}/tasks`).send(body);

describe('POST /api/children/:id/tasks', () => {
  test('is closed (401) when no user is set, through the real app', async () => {
    const before = taskCount();
    const res = await request(realApp).post(`/api/children/${childId}/tasks`).send(validTask);
    expect(res.status).toBe(401);
    expect(taskCount()).toBe(before);
  });

  test('the parent of the child can assign a task', async () => {
    const res = await post(parent, validTask);
    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({
      childId,
      assignedBy: parent.id,
      status: 'pending',
      completedAt: null,
      ...validTask,
    });
    const row = db.prepare('SELECT title, status FROM tasks WHERE id = ?').get(res.body.task.id);
    expect(row).toEqual({ title: 'Read a picture book', status: 'pending' });
  });

  test('a linked specialist can assign a task', async () => {
    const res = await post(linkedSpecialist, validTask);
    expect(res.status).toBe(201);
    expect(res.body.task.assignedBy).toBe(linkedSpecialist.id);
  });

  test('the description is optional', async () => {
    const { description, ...withoutDescription } = validTask;
    const res = await post(parent, withoutDescription);
    expect(res.status).toBe(201);
    expect(res.body.task.description).toBeNull();
  });

  test.each([
    ['an unlinked specialist', () => unlinkedSpecialist],
    ['the parent of another child', () => otherParent],
    ['a child account', () => childUser],
  ])('%s gets 403 and nothing is saved', async (_label, getUser) => {
    const before = taskCount();
    const res = await post(getUser(), validTask);
    expect(res.status).toBe(403);
    expect(taskCount()).toBe(before);
  });

  test('a child id that does not exist gives the same 403', async () => {
    const before = taskCount();
    const res = await post(parent, validTask, 99999);
    expect(res.status).toBe(403);
    expect(taskCount()).toBe(before);
  });

  test.each([
    ['a missing title', { title: undefined }],
    ['a blank title', { title: '   ' }],
    ['an unknown development area', { developmentArea: 'Music' }],
    ['a missing development area', { developmentArea: undefined }],
    ['a due date that is not a date', { dueDate: 'tomorrow' }],
    ['a due date that does not exist', { dueDate: '2026-02-30' }],
    ['a missing due date', { dueDate: undefined }],
    ['a description that is not text', { description: 42 }],
  ])('rejects %s with 400 and saves nothing', async (_label, change) => {
    const before = taskCount();
    const res = await post(parent, { ...validTask, ...change });
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(taskCount()).toBe(before);
  });
});

describe('GET /api/children/:id/tasks?week=', () => {
  const get = (user, query = '', id = childBId) => request(appAs(user)).get(`/api/children/${id}/tasks${query}`);

  beforeAll(() => {
    // Week of 2026-11-09 (Monday) to 2026-11-15 (Sunday), plus the day before and the day after.
    addTask(childBId, parent.id, 'Sunday before', '2026-11-08');
    addTask(childBId, parent.id, 'Last day of the week', '2026-11-15');
    addTask(childBId, linkedSpecialist.id, 'First day of the week', '2026-11-09');
    addTask(childBId, parent.id, 'Monday after', '2026-11-16');
  });

  test('is closed (401) when no user is set, through the real app', async () => {
    const res = await request(realApp).get(`/api/children/${childBId}/tasks`);
    expect(res.status).toBe(401);
  });

  test('lists only the tasks due in the selected week (Monday to Sunday), ordered by due date', async () => {
    const res = await get(parent, '?week=2026-11-11');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ weekStart: '2026-11-09', weekEnd: '2026-11-15' });
    expect(res.body.tasks.map((t) => t.title)).toEqual(['First day of the week', 'Last day of the week']);
    expect(res.body.tasks[0]).toMatchObject({ childId: childBId, status: 'pending', developmentArea: 'Language' });
  });

  test('a week without tasks gives an empty list', async () => {
    const res = await get(parent, '?week=2027-01-04');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });

  test('without a week it uses the current week', async () => {
    const res = await get(parent);
    expect(res.status).toBe(200);
    expect(res.body.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test.each([
    ['the parent', () => parent],
    ['a linked specialist', () => linkedSpecialist],
    ["the child's own account", () => childBUser],
  ])('%s can read the list', async (_label, getUser) => {
    const res = await get(getUser(), '?week=2026-11-09');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
  });

  test.each([
    ['an unlinked specialist', () => unlinkedSpecialist],
    ['the parent of another child', () => otherParent],
    ["another child's account", () => otherChildUser],
    ["the other child of the same parent", () => childUser],
  ])('%s gets 403', async (_label, getUser) => {
    const res = await get(getUser(), '?week=2026-11-09');
    expect(res.status).toBe(403);
    expect(res.body.tasks).toBeUndefined();
  });

  test('a week that is not a date gives 400', async () => {
    const res = await get(parent, '?week=next-week');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/children/:id/tasks/:taskId/complete', () => {
  const complete = (user, taskId, id = childBId) =>
    request(appAs(user)).post(`/api/children/${id}/tasks/${taskId}/complete`);

  test('is closed (401) when no user is set, through the real app', async () => {
    const taskId = addTask(childBId, parent.id, 'Closed by default', '2026-12-01');
    const res = await request(realApp).post(`/api/children/${childBId}/tasks/${taskId}/complete`);
    expect(res.status).toBe(401);
    expect(statusOf(taskId)).toBe('pending');
  });

  test('the child marks their own pending task as done', async () => {
    const taskId = addTask(childBId, parent.id, 'Brush teeth', '2026-12-01');
    const res = await complete(childBUser, taskId);
    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ id: taskId, childId: childBId, status: 'done' });
    expect(res.body.task.completedAt).toEqual(expect.any(String));
    expect(statusOf(taskId)).toBe('done');
  });

  test('the assigner sees the status "done" in the task list (Flow 1)', async () => {
    const taskId = addTask(childBId, linkedSpecialist.id, 'Read for 20 minutes', '2026-12-02');
    await complete(childBUser, taskId);
    const res = await request(appAs(linkedSpecialist)).get(`/api/children/${childBId}/tasks?week=2026-12-02`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.find((t) => t.id === taskId)).toMatchObject({
      assignedBy: linkedSpecialist.id,
      status: 'done',
    });
  });

  test('marking a task as done twice is allowed and keeps the first completion time', async () => {
    const taskId = addTask(childBId, parent.id, 'Twice', '2026-12-03');
    const first = await complete(childBUser, taskId);
    const second = await complete(childBUser, taskId);
    expect(second.status).toBe(200);
    expect(second.body.task.completedAt).toBe(first.body.task.completedAt);
  });

  test.each([
    ['the parent', () => parent],
    ['a linked specialist', () => linkedSpecialist],
    ['an unlinked specialist', () => unlinkedSpecialist],
    ['the other child of the same parent', () => childUser],
    ["another family's child", () => otherChildUser],
  ])('%s cannot mark the task as done (403)', async (_label, getUser) => {
    const taskId = addTask(childBId, parent.id, 'Not yours to finish', '2026-12-04');
    const res = await complete(getUser(), taskId);
    expect(res.status).toBe(403);
    expect(statusOf(taskId)).toBe('pending');
  });

  test("a child cannot finish another child's task by putting their own id in the URL (404)", async () => {
    const othersTask = addTask(otherChildId, otherParent.id, 'Other family task', '2026-12-05');
    const res = await complete(childBUser, othersTask, childBId);
    expect(res.status).toBe(404);
    expect(statusOf(othersTask)).toBe('pending');
  });

  test('a task id that does not exist gives 404', async () => {
    const res = await complete(childBUser, 99999);
    expect(res.status).toBe(404);
  });
});
