const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB

const addUser = (email, role) =>
  db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid;

const addChild = (parentId, childUserId, name) =>
  db.prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)').run(parentId, childUserId, name).lastInsertRowid;

const linkCount = (childId) =>
  db.prepare('SELECT COUNT(*) AS n FROM specialist_links WHERE child_id = ?').get(childId).n;

const bearer = (id, role) => `Bearer ${jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;

let parentId, otherParentId, specialistId, childUserId, childId, otherChildId;

beforeAll(() => {
  parentId = addUser('link-parent@example.com', 'parent');
  otherParentId = addUser('link-other-parent@example.com', 'parent');
  specialistId = addUser('link-teacher@example.com', 'specialist');
  addUser('link-specialist-2@example.com', 'specialist');
  childUserId = addUser('link-child@example.com', 'child');
  childId = addChild(parentId, childUserId, 'Link Child');
  otherChildId = addChild(otherParentId, null, 'Other Child');
});

const link = (childIdParam, body, auth = bearer(parentId, 'parent')) =>
  request(app).post(`/api/children/${childIdParam}/specialists`).set('Authorization', auth).send(body);

describe('POST /api/children/:id/specialists (US-M2-01)', () => {
  test('the parent links a registered specialist by email and type', async () => {
    const res = await link(childId, { email: 'link-teacher@example.com', type: 'teacher' });
    expect(res.status).toBe(201);
    expect(res.body.link).toEqual(expect.objectContaining({
      specialistId, email: 'link-teacher@example.com', name: 'link-teacher@example.com', type: 'teacher',
    }));
    expect(linkCount(childId)).toBe(1);
  });

  test('ignores case and spaces in the email', async () => {
    const res = await link(childId, { email: '  LINK-Specialist-2@Example.com ', type: 'coach' });
    expect(res.status).toBe(201);
    expect(res.body.link.type).toBe('coach');
  });

  test('rejects an already linked specialist with 409', async () => {
    const before = linkCount(childId);
    const res = await link(childId, { email: 'link-teacher@example.com', type: 'doctor' });
    expect(res.status).toBe(409);
    expect(linkCount(childId)).toBe(before);
  });

  test.each([
    ['an unregistered email', 'nobody@example.com'],
    ['an account that is not a specialist', 'link-child@example.com'],
  ])('rejects %s with 404 and creates no link', async (_, email) => {
    const before = linkCount(childId);
    const res = await link(childId, { email, type: 'teacher' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('No registered specialist with this email.');
    expect(linkCount(childId)).toBe(before);
  });

  test.each([
    ['a missing email', { type: 'teacher' }, 'Email is required.'],
    ['an empty email', { email: '   ', type: 'teacher' }, 'Email is required.'],
    ['a missing type', { email: 'link-teacher@example.com' }, /^Type must be one of/],
    ['an unknown type', { email: 'link-teacher@example.com', type: 'nurse' }, /^Type must be one of/],
  ])('rejects %s with 400', async (_, body, message) => {
    const res = await link(childId, body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
  });
});

describe('POST /api/children/:id/specialists access control', () => {
  test('rejects a request without a token with 401', async () => {
    const res = await request(app).post(`/api/children/${childId}/specialists`)
      .send({ email: 'link-teacher@example.com', type: 'teacher' });
    expect(res.status).toBe(401);
  });

  test.each([
    ['a specialist', () => bearer(specialistId, 'specialist')],
    ['the child', () => bearer(childUserId, 'child')],
  ])('rejects %s with 403', async (_, auth) => {
    const res = await link(childId, { email: 'link-teacher@example.com', type: 'teacher' }, auth());
    expect(res.status).toBe(403);
  });

  test.each([
    ['a child of another parent', () => otherChildId],
    ['a child that does not exist', () => 99999],
    ['an invalid child id', () => 'abc'],
  ])('rejects %s with 403 and creates no link', async (_, id) => {
    const res = await link(id(), { email: 'link-teacher@example.com', type: 'teacher' });
    expect(res.status).toBe(403);
    expect(linkCount(otherChildId)).toBe(0);
  });
});