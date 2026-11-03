const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();
router.get('/:id/events', eventController.list);
router.get('/:id/events/upcoming', eventController.upcoming);
router.post('/:id/events', eventController.create);

module.exports = router;
