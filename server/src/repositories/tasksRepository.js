const db = require('../db');

const findById = (id) => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

// New tasks always start as 'pending' (column default).
const insert = ({ childId, assignedBy, title, description, developmentArea, dueDate }) => {
  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO tasks (child_id, assigned_by, title, description, development_area, due_date) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(childId, assignedBy, title, description, developmentArea, dueDate);
  return findById(lastInsertRowid);
};

// Tasks due in [from, to), ordered by due date. Both are "YYYY-MM-DD".
const findDueInRange = (childId, from, to) =>
  db
    .prepare('SELECT * FROM tasks WHERE child_id = ? AND due_date >= ? AND due_date < ? ORDER BY due_date, id')
    .all(childId, from, to);

// Only a pending task changes; a task that is already done keeps its completed_at.
const markDone = (id) => {
  db.prepare("UPDATE tasks SET status = 'done', completed_at = datetime('now') WHERE id = ? AND status = 'pending'").run(id);
  return findById(id);
};

module.exports = { findById, insert, findDueInRange, markDone };
