const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();
router.post('/:id/tasks', taskController.create);

module.exports = router;
