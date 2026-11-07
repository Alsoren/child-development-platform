const db = require('../db');

const isParentOf = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM children WHERE id = ? AND parent_id = ?').get(childId, userId));

const isLinkedSpecialist = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_id = ?').get(childId, userId));

const isChildAccountOf = (userId, childId) =>
  Boolean(db.prepare('SELECT 1 FROM children WHERE id = ? AND user_id = ?').get(childId, userId));

const findSpecialistByEmail = (email) =>
  db.prepare("SELECT id, email, name FROM users WHERE email = ? AND role = 'specialist'").get(email);

// One linked specialist of a child, in the shape the API returns.
const findLink = (childId, specialistId) =>
  db
    .prepare(
      `SELECT u.id AS specialistId, u.name, u.email, l.specialist_type AS type, l.created_at AS linkedAt
       FROM specialist_links l JOIN users u ON u.id = l.specialist_id
       WHERE l.child_id = ? AND l.specialist_id = ?`
    )
    .get(childId, specialistId);

const insert = ({ childId, specialistId, type }) => {
  db.prepare('INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, specialistId, type);
  return findLink(childId, specialistId);
};

module.exports = { isParentOf, isLinkedSpecialist, isChildAccountOf, findSpecialistByEmail, findLink, insert };