const express = require('express');
const db = require('../db');

// Walking skeleton (v0.0). Temporary: replaced by the M4 task endpoints.
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/sample-task', (req, res) => {
  const task = db
    .prepare(`SELECT id, title, development_area AS developmentArea, due_date AS dueDate, status
              FROM tasks ORDER BY id LIMIT 1`)
    .get();
  if (!task) return res.status(404).json({ error: 'No sample task. Run npm run seed.' });
  res.json({ task });
});

module.exports = router;