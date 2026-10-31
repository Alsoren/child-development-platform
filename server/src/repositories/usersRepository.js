const db = require('../db');

const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email);

module.exports = { findByEmail };