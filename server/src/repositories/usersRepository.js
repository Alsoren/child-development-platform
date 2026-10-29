const db = require('../db');

const findByEmail = (email) =>
  db.prepare('SELECT * FROM users WHERE email = ?').get(email);

const create = ({ email, passwordHash, role, name }) => {
  const result = db
    .prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)')
    .run(email, passwordHash, role, name);
  return { id: result.lastInsertRowid, email, role, name };
};

module.exports = { findByEmail, create };