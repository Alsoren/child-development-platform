const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    res.json(await authService.login(req.body));
  } catch (err) {
    next(err);
  }
};

module.exports = { login };