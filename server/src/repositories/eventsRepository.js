const db = require('../db');

const isParentOf = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM children WHERE id = ? AND parent_id = ?').get(childId, userId));

const isLinkedSpecialist = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_id = ?').get(childId, userId));

const findById = (id) => db.prepare('SELECT * FROM events WHERE id = ?').get(id);

// Events that start in [from, to), ordered by date and time. Both are "YYYY-MM-DD HH:MM".
const findInRange = (childId, from, to) =>
  db
    .prepare('SELECT * FROM events WHERE child_id = ? AND start_at >= ? AND start_at < ? ORDER BY start_at, id')
    .all(childId, from, to);

const insert = ({ childId, createdBy, title, startAt, endAt }) => {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO events (child_id, created_by, title, start_at, end_at) VALUES (?, ?, ?, ?, ?)')
    .run(childId, createdBy, title, startAt, endAt);
  return findById(lastInsertRowid);
};

module.exports = { isParentOf, isLinkedSpecialist, findInRange, insert };
