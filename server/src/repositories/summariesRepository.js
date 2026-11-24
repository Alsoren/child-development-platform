const db = require('../db');

const findChildName = (childId) => db.prepare('SELECT name FROM children WHERE id = ?').get(childId)?.name;

const findById = (id) => db.prepare('SELECT * FROM summaries WHERE id = ?').get(id);

const findSources = (summaryId) =>
  db.prepare('SELECT source_type, source_id FROM summary_sources WHERE summary_id = ? ORDER BY id').all(summaryId);

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
