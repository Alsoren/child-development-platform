const taskService = require('../services/taskService');

const create = (req, res, next) => {
  try {
    const task = taskService.createTask(req.user, req.params.id, req.body);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

const list = (req, res, next) => {
  try {
    res.json(taskService.listWeek(req.user, req.params.id, req.query.week));
  } catch (err) {
    next(err);
  }
};

const complete = (req, res, next) => {
  try {
    const task = taskService.completeTask(req.user, req.params.id, req.params.taskId);
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, complete };
