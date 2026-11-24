const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AI_PROVIDER = 'mock';

const app = require('../src/app');
const db = require('../src/db'); // NODE_ENV=test → in-memory DB
const aiClient = require('../src/ai/aiClient');
const { MOCK_SUMMARY } = require('../src/ai/mockProvider');
const summariesRepository = require('../src/repositories/summariesRepository');
const { weekRange } = require('../src/utils/dates');

const addUser = (email, role) =>
  db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)').run(email, 'x', role, email).lastInsertRowid;

const addChild = (parentId, childUserId, name) =>
  db.prepare('INSERT INTO children (parent_id, user_id, name) VALUES (?, ?, ?)').run(parentId, childUserId, name).lastInsertRowid;

const addTask = (forChildId, assignedBy, title, area, dueDate, status = 'pending') =>
  db
    .prepare('INSERT INTO tasks (child_id, assigned_by, title, development_area, due_date, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(forChildId, assignedBy, title, area, dueDate, status).lastInsertRowid;

const bearer = (id, role) => `Bearer ${jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
const summaryCount = () => db.prepare('SELECT COUNT(*) AS n FROM summaries').get().n;
const sourceCount = () => db.prepare('SELECT COUNT(*) AS n FROM summary_sources').get().n;

const UNAVAILABLE = 'The AI summary is not available right now. Please try again later.';

let parentId, otherParentId, specialistId, unlinkedId, childUserId, childId, otherChildId;
let readTaskId, towerTaskId;
let generateSpy;

beforeAll(() => {
  parentId = addUser('s-parent@example.com', 'parent');
  otherParentId = addUser('s-other-parent@example.com', 'parent');
  specialistId = addUser('s-teacher@example.com', 'specialist');
  unlinkedId = addUser('s-unlinked@example.com', 'specialist');
  childUserId = addUser('s-child@example.com', 'child');
  childId = addChild(parentId, childUserId, 'Demo Child');
  otherChildId = addChild(otherParentId, null, 'Other Child');
  db.prepare("INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, 'teacher')")
    .run(childId, specialistId);

  // Week of Monday 2026-12-07 to Sunday 2026-12-13, plus tasks that must not be sent.
  readTaskId = addTask(childId, specialistId, 'Read for 20 minutes', 'Language', '2026-12-08', 'done');
  towerTaskId = addTask(childId, parentId, 'Build a tower', 'Motor', '2026-12-10');
  addTask(childId, parentId, 'Next week task', 'Social', '2026-12-15');
  addTask(otherChildId, otherParentId, 'Other family task', 'Social', '2026-12-09');
});

beforeEach(() => {
  generateSpy = jest.spyOn(aiClient, 'generateSummary');
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  process.env.AI_PROVIDER = 'mock';
  delete process.env.AI_API_KEY;
});

const create = (id, auth, week = '2026-12-10') =>
  request(app).post(`/api/children/${id}/summary${week ? `?week=${week}` : ''}`).set('Authorization', auth);
const latest = (id, auth, week = '2026-12-10') =>
  request(app).get(`/api/children/${id}/summary${week ? `?week=${week}` : ''}`).set('Authorization', auth);

describe('POST /api/children/:id/summary (US-M8-01, US-M8-02)', () => {
  test('is closed (401) without a token', async () => {
    const res = await request(app).post(`/api/children/${childId}/summary?week=2026-12-10`);
    expect(res.status).toBe(401);
    expect(generateSpy).not.toHaveBeenCalled();
  });

  test('the parent gets a summary of the week and the records it is based on', async () => {
    const res = await create(childId, bearer(parentId, 'parent'));

    expect(res.status).toBe(201);
    expect(res.body.summary).toMatchObject({
      childId,
      readerRole: 'parent',
      weekStart: '2026-12-07',
      weekEnd: '2026-12-13',
      text: MOCK_SUMMARY,
      provider: 'mock',
      sources: [{ type: 'task', id: readTaskId }, { type: 'task', id: towerTaskId }],
    });
    expect(res.body.summary.id).toEqual(expect.any(Number));
    expect(summaryCount()).toBe(1);
    expect(sourceCount()).toBe(2);
  });

  test('the parent prompt is used and only the records of that week and child are sent', async () => {
    await create(childId, bearer(parentId, 'parent'));

    const prompt = generateSpy.mock.calls[0][0];
    expect(prompt.system).toMatch(/plain, warm language/);
    expect(prompt.system).toMatch(/do not diagnose/i);
    expect(prompt.user).toContain('Child: Demo Child');
    expect(prompt.user).toContain('Week: 2026-12-07 to 2026-12-13');
    expect(prompt.user).toContain('Read for 20 minutes (Language), due 2026-12-08, status: done');
    expect(prompt.user).toContain('Build a tower (Motor), due 2026-12-10, status: pending');
    expect(prompt.user).not.toContain('Next week task');
    expect(prompt.user).not.toContain('Other family task');
  });

  test('a linked specialist gets a summary with the specialist prompt', async () => {
    const res = await create(childId, bearer(specialistId, 'specialist'));

    expect(res.status).toBe(201);
    expect(res.body.summary.readerRole).toBe('specialist');
    const prompt = generateSpy.mock.calls[0][0];
    expect(prompt.system).toMatch(/compact and professional/);
    expect(prompt.user).toContain('Build a tower');
    expect(prompt.user).not.toContain('Other family task');
  });

  test('without a week it uses the current week', async () => {
    const res = await create(childId, bearer(parentId, 'parent'), '');
    expect(res.status).toBe(201);
    expect(res.body.summary.weekStart).toBe(weekRange().weekStart);
  });

  test('a week without records is still summarized and the prompt says there are none', async () => {
    const res = await create(childId, bearer(parentId, 'parent'), '2027-06-09');

    expect(res.status).toBe(201);
    expect(res.body.summary.sources).toEqual([]);
    expect(generateSpy.mock.calls[0][0].user).toContain('Tasks:\n(none)');
  });

  test.each([
    ['a child account', () => bearer(childUserId, 'child'), () => childId],
    ['an unlinked specialist', () => bearer(unlinkedId, 'specialist'), () => childId],
    ["another family's parent", () => bearer(otherParentId, 'parent'), () => childId],
    ['an unknown child id', () => bearer(parentId, 'parent'), () => 9999],
  ])('rejects %s with 403: nothing is sent to the AI and nothing is saved', async (_label, auth, id) => {
    const before = summaryCount();
    const res = await create(id(), auth());

    expect(res.status).toBe(403);
    expect(generateSpy).not.toHaveBeenCalled();
    expect(summaryCount()).toBe(before);
  });

  test.each(['abc', '2026-02-30', '12/10/2026'])('rejects the week "%s" with 400', async (week) => {
    const before = summaryCount();
    const res = await create(childId, bearer(parentId, 'parent'), week);

    expect(res.status).toBe(400);
    expect(generateSpy).not.toHaveBeenCalled();
    expect(summaryCount()).toBe(before);
  });

  test('a failing provider gives 502 with a clear message, saves nothing, and the rest still works (US-M8-05)', async () => {
    process.env.AI_PROVIDER = 'gemini'; // no key set
    const before = { summaries: summaryCount(), sources: sourceCount() };

    const res = await create(childId, bearer(parentId, 'parent'));

    expect(res.status).toBe(502);
    expect(res.body.error).toBe(UNAVAILABLE);
    expect(summaryCount()).toBe(before.summaries);
    expect(sourceCount()).toBe(before.sources);
    expect((await latest(childId, bearer(parentId, 'parent'))).status).toBe(200);
  });
});

describe('GET /api/children/:id/summary', () => {
  const WEEK = '2027-03-10'; // Monday 2027-03-08 to Sunday 2027-03-14

  beforeAll(() => {
    const parentTask = addTask(childId, parentId, 'March task', 'Language', '2027-03-09');
    const save = (requestedBy, readerRole, text, sources) =>
      summariesRepository.insert({ childId, requestedBy, readerRole, weekStart: '2027-03-08', text, provider: 'mock', sources });
    save(parentId, 'parent', 'Older parent summary', []);
    save(parentId, 'parent', 'Newer parent summary', [{ type: 'task', id: parentTask }]);
    save(specialistId, 'specialist', 'Specialist summary', []);
  });

  test('is closed (401) without a token', async () => {
    const res = await request(app).get(`/api/children/${childId}/summary?week=${WEEK}`);
    expect(res.status).toBe(401);
  });

  test('returns the newest summary of the week for the role of the caller', async () => {
    const res = await latest(childId, bearer(parentId, 'parent'), WEEK);

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({
      readerRole: 'parent',
      weekStart: '2027-03-08',
      weekEnd: '2027-03-14',
      text: 'Newer parent summary',
      provider: 'mock',
    });
    expect(res.body.summary.sources).toHaveLength(1);
  });

  test('a specialist gets the specialist summary, not the parent one', async () => {
    const res = await latest(childId, bearer(specialistId, 'specialist'), WEEK);
    expect(res.body.summary.text).toBe('Specialist summary');
  });

  test('returns the week and null when the week has no summary', async () => {
    const res = await latest(childId, bearer(parentId, 'parent'), '2027-09-08');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ weekStart: '2027-09-06', weekEnd: '2027-09-12', summary: null });
  });

  test.each([
    ['a child account', () => bearer(childUserId, 'child')],
    ['an unlinked specialist', () => bearer(unlinkedId, 'specialist')],
    ["another family's parent", () => bearer(otherParentId, 'parent')],
  ])('rejects %s with 403 and no summary', async (_label, auth) => {
    const res = await latest(childId, auth(), WEEK);
    expect(res.status).toBe(403);
    expect(res.body.summary).toBeUndefined();
  });

  test('rejects an invalid week with 400', async () => {
    expect((await latest(childId, bearer(parentId, 'parent'), 'abc')).status).toBe(400);
  });
});
