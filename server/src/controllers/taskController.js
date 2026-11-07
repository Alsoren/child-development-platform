const taskService = require('../services/taskService');

const create = (req, res, next) => {
  try {
    const task = taskService.createTask(req.user, req.params.id, req.body);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
