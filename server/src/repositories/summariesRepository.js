const db = require('../db');

const findChildName = (childId) => db.prepare('SELECT name FROM children WHERE id = ?').get(childId)?.name;

const findById = (id) => db.prepare('SELECT * FROM summaries WHERE id = ?').get(id);

// The records a summary is based on. Tasks come with their title and due date so the screen can
// show readable links; the join is a LEFT JOIN so a source never disappears if its record is gone.
const findSources = (summaryId) =>
  db
    .prepare(
      `SELECT s.source_type, s.source_id, t.title, t.due_date
       FROM summary_sources s
       LEFT JOIN tasks t ON s.source_type = 'task' AND t.id = s.source_id
       WHERE s.summary_id = ? ORDER BY s.id`
    )
    .all(summaryId);

// The newest summary of a week that was written for one reader role.
const findLatest = (childId, weekStart, readerRole) =>
  db
    .prepare(
      'SELECT * FROM summaries WHERE child_id = ? AND week_start = ? AND reader_role = ? ORDER BY id DESC LIMIT 1'
    )
    .get(childId, weekStart, readerRole);

// Saves a summary and the records it is based on together, or neither.
const insert = ({ childId, requestedBy, readerRole, weekStart, text, provider, sources }) =>
  db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO summaries (child_id, requested_by, reader_role, week_start, text, provider) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(childId, requestedBy, readerRole, weekStart, text, provider);
    const addSource = db.prepare('INSERT INTO summary_sources (summary_id, source_type, source_id) VALUES (?, ?, ?)');
    sources.forEach((source) => addSource.run(lastInsertRowid, source.type, source.id));
    return lastInsertRowid;
  })();

module.exports = { findChildName, findById, findSources, findLatest, insert };
