const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRepository = require('../repositories/usersRepository');
const HttpError = require('../utils/httpError');

const ROLES = ['parent', 'specialist', 'child'];

async function register({ name, email, password, role }) {
  if (!name || !email || !password || !role) throw new HttpError(400, 'All fields are required.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role.');

  const normalizedEmail = email.trim().toLowerCase();
  if (usersRepository.findByEmail(normalizedEmail)) {
    throw new HttpError(409, 'Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return usersRepository.create({ email: normalizedEmail, passwordHash, role, name: name.trim() });
}

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

module.exports = { register, login };