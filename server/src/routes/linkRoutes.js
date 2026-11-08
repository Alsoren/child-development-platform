const express = require('express');
const linkController = require('../controllers/linkController');
const { requireRole } = require('../middleware/auth');
const { requireChildAccess } = require('../middleware/childAccess');

// Mounted under /api/children, after authenticate.
const router = express.Router();
router.get('/', linkController.listChildren);
router.get('/:id/specialists', requireRole('parent'), requireChildAccess(), linkController.list);
router.post('/:id/specialists', requireRole('parent'), requireChildAccess(), linkController.create);

module.exports = router;