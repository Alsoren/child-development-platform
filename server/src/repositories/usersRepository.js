const db = require('../db');

const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email);

const findById = (id) =>
  db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(id);

module.exports = { findByEmail, findById };