const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

// Verifies the JWT in the Authorization header ("Bearer <token>").
// jwt.verify also rejects expired tokens (US-M1-04).
function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authentication required.'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token.'));
  }
}

// Usage: requireRole('parent', 'specialist')
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : next(new HttpError(403, 'Not allowed for this role.'));

module.exports = { authenticate, requireRole };