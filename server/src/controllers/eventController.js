const eventService = require('../services/eventService');

const create = (req, res, next) => {
  try {
    const event = eventService.createEvent(req.user, req.params.id, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

const list = (req, res, next) => {
  try {
    res.json(eventService.listWeek(req.user, req.params.id, req.query.week));
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list };
