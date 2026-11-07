const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRepository = require('../repositories/usersRepository');
const HttpError = require('../utils/httpError');

async function login({ email, password }) {
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');

  const user = usersRepository.findByEmail(email.trim().toLowerCase());
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) throw new HttpError(401, 'Invalid email or password.');

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  return { token, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
}

function getMe(userId) {
  const user = usersRepository.findById(userId);
  if (!user) throw new HttpError(401, 'User no longer exists.');
  return { user };
}

module.exports = { login, getMe };