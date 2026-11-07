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
