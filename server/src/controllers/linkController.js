const linkService = require('../services/linkService');

const create = (req, res, next) => {
  try {
    const link = linkService.linkSpecialist(req.childId, req.body);
    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
};

const list = (req, res, next) => {
  try {
    res.json(linkService.listSpecialists(req.childId));
  } catch (err) {
    next(err);
  }
};

const listChildren = (req, res, next) => {
  try {
    res.json(linkService.listChildren(req.user));
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, listChildren };