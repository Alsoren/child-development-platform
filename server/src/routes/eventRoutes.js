const express = require('express');
const eventController = require('../controllers/eventController');

const router = express.Router();
router.post('/:id/events', eventController.create);

module.exports = router;
