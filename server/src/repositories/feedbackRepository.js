const db = require('../db');

// The rating one user gave to one summary, or null if they have not voted.
const findRating = (summaryId, userId) =>
  db.prepare('SELECT rating FROM summary_feedback WHERE summary_id = ? AND user_id = ?').get(summaryId, userId)?.rating ?? null;

// One vote per user and summary: a second vote replaces the first.
const upsert = (summaryId, userId, rating) =>
  db
    .prepare(
      `INSERT INTO summary_feedback (summary_id, user_id, rating) VALUES (?, ?, ?)
       ON CONFLICT(summary_id, user_id) DO UPDATE SET rating = excluded.rating`
    )
    .run(summaryId, userId, rating);

module.exports = { findRating, upsert };
