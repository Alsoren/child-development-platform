const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    res.json(await authService.login(req.body));
  } catch (err) {
    next(err);
  }
};

const me = (req, res) => {
  res.json(authService.getMe(req.user.id));
};

module.exports = { login, me };