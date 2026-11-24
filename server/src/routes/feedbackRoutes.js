const express = require('express');
const feedbackController = require('../controllers/feedbackController');

// Mounted under /api/summaries, after authenticate. There is no requireRole here on purpose: the
// service answers 404 for a child account too, the same as for an unknown summary.
const router = express.Router();
router.post('/:summaryId/feedback', feedbackController.create);

module.exports = router;
