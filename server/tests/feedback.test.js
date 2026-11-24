const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AI_PROVIDER = 'mock';

const app = require('../src/app');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB

const addUser = (email, role) =>
  db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid;

const addChild = (parentId, childUserId, name) =>
  db.prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)').run(parentId, childUserId, name).lastInsertRowid;

const link = (childId, specialistId) =>
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')").run(childId, specialistId);

const addTask = (forChildId, assignedBy, title, area, dueDate, status = 'pending') =>
  db
    .prepare('INSERT INTO tasks (child_id, assigned_by, title, development_area, due_date, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(forChildId, assignedBy, title, area, dueDate, status).lastInsertRowid;

const bearer = (id, role) => `Bearer ${jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
const feedbackRows = () => db.prepare('SELECT * FROM summary_feedback ORDER BY id').all();
const feedbackCount = () => feedbackRows().length;

const WEEK = '2026-12-10'; // Monday 2026-12-07 to Sunday 2026-12-13

let parentId, otherParentId, specialistId, unlinkedId, formerId, childUserId, childId, otherChildId;
let readTaskId;
let parentSummaryId, specialistSummaryId, formerSummaryId, otherFamilySummaryId;

const createSummary = async (id, auth) => {
  const res = await request(app).post(`/api/children/${id}/summary?week=${WEEK}`).set('Authorization', auth);
  expect(res.status).toBe(201);
  return res.body.summary;
};
const rate = (summaryId, auth, body) =>
  request(app).post(`/api/summaries/${summaryId}/feedback`).set('Authorization', auth).send(body);
const latest = (id, auth) => request(app).get(`/api/children/${id}/summary?week=${WEEK}`).set('Authorization', auth);

beforeAll(async () => {
  parentId = addUser('f-parent@example.com', 'parent');
  otherParentId = addUser('f-other-parent@example.com', 'parent');
  specialistId = addUser('f-teacher@example.com', 'specialist');
  unlinkedId = addUser('f-unlinked@example.com', 'specialist');
  formerId = addUser('f-former@example.com', 'specialist');
  childUserId = addUser('f-child@example.com', 'child');
  childId = addChild(parentId, childUserId, 'Demo Child');
  otherChildId = addChild(otherParentId, null, 'Other Child');
  link(childId, specialistId);
  link(childId, formerId);

  readTaskId = addTask(childId, specialistId, 'Read for 20 minutes', 'Language', '2026-12-08', 'done');
  addTask(childId, parentId, 'Build a tower', 'Motor', '2026-12-10');
  addTask(otherChildId, otherParentId, 'Other family task', 'Social', '2026-12-09');

  parentSummaryId = (await createSummary(childId, bearer(parentId, 'parent'))).id;
  specialistSummaryId = (await createSummary(childId, bearer(specialistId, 'specialist'))).id;
  formerSummaryId = (await createSummary(childId, bearer(formerId, 'specialist'))).id;
  otherFamilySummaryId = (await createSummary(otherChildId, bearer(otherParentId, 'parent'))).id;

  // The former specialist is unlinked now but still holds a valid token.
  db.prepare('DELETE FROM specialist_links WHERE child_id = ? AND specialist_id = ?').run(childId, formerId);
});

afterEach(() => {
  db.prepare('DELETE FROM summary_feedback').run();
});

describe('POST /api/summaries/:summaryId/feedback (US-M8-03)', () => {
  test('is closed (401) without a token', async () => {
    const res = await request(app).post(`/api/summaries/${parentSummaryId}/feedback`).send({ rating: 'helpful' });
    expect(res.status).toBe(401);
    expect(feedbackCount()).toBe(0);
  });

  test('the parent can rate the summary written for parents', async () => {
    const res = await rate(parentSummaryId, bearer(parentId, 'parent'), { rating: 'helpful' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ feedback: { summaryId: parentSummaryId, rating: 'helpful' } });
    expect(feedbackRows()).toEqual([
      expect.objectContaining({ summary_id: parentSummaryId, user_id: parentId, rating: 'helpful' }),
    ]);
  });

  test('a linked specialist can rate the summary written for specialists', async () => {
    const res = await rate(specialistSummaryId, bearer(specialistId, 'specialist'), { rating: 'incorrect' });

    expect(res.status).toBe(200);
    expect(res.body.feedback).toEqual({ summaryId: specialistSummaryId, rating: 'incorrect' });
    expect(feedbackRows()).toHaveLength(1);
  });

  test('a second vote replaces the first: one row per user and summary', async () => {
    const auth = bearer(parentId, 'parent');
    await rate(parentSummaryId, auth, { rating: 'helpful' });
    const res = await rate(parentSummaryId, auth, { rating: 'incorrect' });

    expect(res.status).toBe(200);
    expect(res.body.feedback.rating).toBe('incorrect');
    const rows = feedbackRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].rating).toBe('incorrect');
  });

  test.each([
    ['a word that is not a rating', { rating: 'great' }],
    ['an empty rating', { rating: '' }],
    ['a number', { rating: 5 }],
    ['a missing rating', {}],
    ['no body', undefined],
  ])('rejects %s with 400 and saves nothing', async (_label, body) => {
    const res = await rate(parentSummaryId, bearer(parentId, 'parent'), body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/helpful/);
    expect(feedbackCount()).toBe(0);
  });

  test.each([
    ['a child account', () => bearer(childUserId, 'child'), () => parentSummaryId],
    ['an unlinked specialist', () => bearer(unlinkedId, 'specialist'), () => specialistSummaryId],
    ["another family's parent", () => bearer(otherParentId, 'parent'), () => parentSummaryId],
    ['a parent rating a specialist summary', () => bearer(parentId, 'parent'), () => specialistSummaryId],
    ['a specialist rating a parent summary', () => bearer(specialistId, 'specialist'), () => parentSummaryId],
    ['a parent rating another family summary', () => bearer(parentId, 'parent'), () => otherFamilySummaryId],
    ['an unknown summary id', () => bearer(parentId, 'parent'), () => 9999],
    ['a summary id that is not a number', () => bearer(parentId, 'parent'), () => 'abc'],
  ])('answers %s with 404 and saves nothing', async (_label, auth, id) => {
    const res = await rate(id(), auth(), { rating: 'helpful' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Summary not found.');
    expect(feedbackCount()).toBe(0);
  });

  test('after unlinking, the former specialist gets 404 with a still valid token', async () => {
    const res = await rate(formerSummaryId, bearer(formerId, 'specialist'), { rating: 'helpful' });

    expect(res.status).toBe(404);
    expect(feedbackCount()).toBe(0);
  });

  test('an unknown id and a forbidden id give the same answer, so ids cannot be probed', async () => {
    const unknown = await rate(9999, bearer(unlinkedId, 'specialist'), { rating: 'helpful' });
    const forbidden = await rate(parentSummaryId, bearer(unlinkedId, 'specialist'), { rating: 'helpful' });

    expect(forbidden.status).toBe(unknown.status);
    expect(forbidden.body).toEqual(unknown.body);
  });
});

describe('summary responses carry myFeedback and readable sources', () => {
  test('a new summary has no feedback yet and its sources carry title and due date', async () => {
    const summary = await createSummary(childId, bearer(parentId, 'parent'));

    expect(summary.myFeedback).toBeNull();
    expect(summary.sources[0]).toEqual({ type: 'task', id: readTaskId, title: 'Read for 20 minutes', dueDate: '2026-12-08' });
    expect(summary.sources[1]).toMatchObject({ type: 'task', title: 'Build a tower', dueDate: '2026-12-10' });
  });

  test('GET shows the caller\'s own vote after rating', async () => {
    const before = await latest(childId, bearer(parentId, 'parent'));
    expect(before.body.summary.myFeedback).toBeNull();

    await rate(before.body.summary.id, bearer(parentId, 'parent'), { rating: 'incorrect' });

    const after = await latest(childId, bearer(parentId, 'parent'));
    expect(after.body.summary.myFeedback).toBe('incorrect');
  });

  test('another user does not see the caller\'s vote as their own', async () => {
    const summaryId = (await latest(childId, bearer(specialistId, 'specialist'))).body.summary.id;
    await rate(summaryId, bearer(specialistId, 'specialist'), { rating: 'helpful' });
    // A second linked specialist reads the same specialist summary: their own vote is still empty.
    const secondId = addUser('f-second@example.com', 'specialist');
    link(childId, secondId);

    const res = await latest(childId, bearer(secondId, 'specialist'));

    expect(res.body.summary.id).toBe(summaryId);
    expect(res.body.summary.myFeedback).toBeNull();
  });
});
