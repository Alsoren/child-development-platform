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

// All specialists linked to a child, oldest link first.
const findByChild = (childId) =>
  db
    .prepare(
      `SELECT u.id AS specialistId, u.name, u.email, l.specialist_type AS type, l.created_at AS linkedAt
       FROM specialist_links l JOIN users u ON u.id = l.specialist_id
       WHERE l.child_id = ? ORDER BY l.created_at, l.id`
    )
    .all(childId);

// The children a user may open: a parent's own children, a specialist's currently linked children,
// a child account's own record.
const findChildrenForUser = (userId, role) => {
  if (role === 'parent') {
    return db.prepare('SELECT id, name FROM children WHERE parent_id = ? ORDER BY name, id').all(userId);
  }
  if (role === 'specialist') {
    return db
      .prepare(
        `SELECT c.id, c.name FROM children c JOIN specialist_links l ON l.child_id = c.id
         WHERE l.specialist_id = ? ORDER BY c.name, c.id`
      )
      .all(userId);
  }
  if (role === 'child') return db.prepare('SELECT id, name FROM children WHERE user_id = ?').all(userId);
  return [];
};

const insert = ({ childId, specialistId, type }) => {
  db.prepare('INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, specialistId, type);
  return findLink(childId, specialistId);
};

module.exports = {
  isParentOf, isLinkedSpecialist, isChildAccountOf, findSpecialistByEmail, findLink, findByChild, findChildrenForUser, insert,
};