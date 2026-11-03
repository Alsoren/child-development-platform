const db = require('../db');

const isParentOf = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM children WHERE id = ? AND parent_id = ?').get(childId, userId));

const isLinkedSpecialist = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_id = ?').get(childId, userId));

const findById = (id) => db.prepare('SELECT * FROM events WHERE id = ?').get(id);

const insert = ({ childId, createdBy, title, startAt, endAt }) => {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO events (child_id, created_by, title, start_at, end_at) VALUES (?, ?, ?, ?, ?)')
    .run(childId, createdBy, title, startAt, endAt);
  return findById(lastInsertRowid);
};

module.exports = { isParentOf, isLinkedSpecialist, insert };
