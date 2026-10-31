const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB

describe('walking skeleton', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/sample-task returns 404 when the database is empty', async () => {
    const res = await request(app).get('/api/sample-task');
    expect(res.status).toBe(404);
  });

  test('GET /api/sample-task returns the task stored in SQLite', async () => {
    const parentId = db.prepare("INSERT INTO users (email, password_hash, role, name) VALUES ('p@example.com', 'x', 'parent', 'P')").run().lastInsertRowid;
    const childId = db.prepare('INSERT INTO children (parent_id, name) VALUES (?, ?)').run(parentId, 'C').lastInsertRowid;
    db.prepare(`INSERT INTO tasks (child_id, assigned_by, title, development_area, due_date)
                VALUES (?, ?, 'Read for 20 minutes', 'Language', '2026-11-01')`).run(childId, parentId);

    const res = await request(app).get('/api/sample-task');
    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ title: 'Read for 20 minutes', status: 'pending' });
  });
});