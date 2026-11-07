const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();
router.get('/:id/tasks', taskController.list);
router.post('/:id/tasks', taskController.create);
router.post('/:id/tasks/:taskId/complete', taskController.complete);

module.exports = router;
