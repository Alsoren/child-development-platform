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

module.exports = { findById, insert };
