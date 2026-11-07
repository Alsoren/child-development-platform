const linkService = require('../services/linkService');

const create = (req, res, next) => {
  try {
    const link = linkService.linkSpecialist(req.childId, req.body);
    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
};

module.exports = { create };