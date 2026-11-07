const express = require('express');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB
const { authenticate, requireRole } = require('../src/middleware/auth');

const PASSWORD = 'Password123';
let parentId;

beforeAll(() => {
  const hash = bcrypt.hashSync(PASSWORD, 4);
  parentId = db
    .prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)')
    .run('auth-parent@example.com', hash, 'parent', 'Auth Parent').lastInsertRowid;
});

const tokenFor = (payload, options = { expiresIn: '1h' }) =>
  jwt.sign(payload, process.env.JWT_SECRET, options);

describe('POST /api/auth/login (US-M1-01)', () => {
  test('returns a token and the user for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auth-parent@example.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: parentId, email: 'auth-parent@example.com', role: 'parent', name: 'Auth Parent',
    });
  });

  test('ignores case and spaces in the email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  AUTH-Parent@Example.com ', password: PASSWORD });
    expect(res.status).toBe(200);
  });

  test('rejects a wrong password with 401 and no token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auth-parent@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  test('rejects a missing field with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'auth-parent@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me and authenticate (US-M1-03, US-M1-04)', () => {
  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 when the header is not a Bearer token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });

  test('returns 401 for a token with a wrong signature', async () => {
    const forged = jwt.sign({ sub: parentId, role: 'parent' }, 'another-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('returns 401 for an expired token', async () => {
    const expired = tokenFor(
      { sub: parentId, role: 'parent', exp: Math.floor(Date.now() / 1000) - 60 },
      {}
    );
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  test('returns 401 when the user no longer exists', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFor({ sub: 99999, role: 'parent' })}`);
    expect(res.status).toBe(401);
  });

  test('returns the current user for a valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFor({ sub: parentId, role: 'parent' })}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: parentId, role: 'parent' });
    expect(res.body.user.password_hash).toBeUndefined();
  });
});

describe('requireRole (US-M1-03)', () => {
  const roleApp = express();
  roleApp.get('/parent-only', authenticate, requireRole('parent'), (req, res) => res.json({ ok: true }));
  roleApp.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));

  test('lets the allowed role through', async () => {
    const res = await request(roleApp)
      .get('/parent-only')
      .set('Authorization', `Bearer ${tokenFor({ sub: 1, role: 'parent' })}`);
    expect(res.status).toBe(200);
  });

  test('returns 403 for a valid token of the wrong role', async () => {
    const res = await request(roleApp)
      .get('/parent-only')
      .set('Authorization', `Bearer ${tokenFor({ sub: 2, role: 'child' })}`);
    expect(res.status).toBe(403);
  });
});

describe('password storage (US-M1-04)', () => {
  test('stores only a bcrypt hash, never the plain password', () => {
    const { password_hash } = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(parentId);
    expect(password_hash).not.toBe(PASSWORD);
    expect(password_hash.startsWith('$2')).toBe(true);
    expect(bcrypt.compareSync(PASSWORD, password_hash)).toBe(true);
  });
});