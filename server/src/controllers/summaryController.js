const summaryService = require('../services/summaryService');

const create = async (req, res, next) => {
  try {
    const summary = await summaryService.createSummary(req.user, req.childId, req.query.week);
    res.status(201).json({ summary });
  } catch (err) {
    next(err);
  }
};

const latest = (req, res, next) => {
  try {
    res.json({ summary: summaryService.getLatest(req.user, req.childId, req.query.week) });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, latest };
