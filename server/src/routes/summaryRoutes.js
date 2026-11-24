const express = require('express');
const summaryController = require('../controllers/summaryController');
const { requireRole } = require('../middleware/auth');
const { requireChildAccess } = require('../middleware/childAccess');

// Mounted under /api/children, after authenticate. Only a parent or a linked specialist; a child never.
const guard = [requireRole('parent', 'specialist'), requireChildAccess()];

const router = express.Router();
router.post('/:id/summary', ...guard, summaryController.create);
router.get('/:id/summary', ...guard, summaryController.latest);

module.exports = router;
