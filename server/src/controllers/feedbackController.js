const feedbackService = require('../services/feedbackService');

const create = (req, res, next) => {
  try {
    const feedback = feedbackService.rate(req.user, Number(req.params.summaryId), req.body?.rating);
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
