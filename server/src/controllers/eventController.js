const eventService = require('../services/eventService');

const create = (req, res, next) => {
  try {
    const event = eventService.createEvent(req.user, req.params.id, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
