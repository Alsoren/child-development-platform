    const linksRepository = require('../repositories/linksRepository');
const HttpError = require('../utils/httpError');

// Third step after authenticate and requireRole: checks the CURRENT relation between the user
// and the child in the database, on every request (never from the token), so an unlink takes
// effect at once (US-M2-03). "No such child" and "not your child" give the same 403.
// Usage: requireChildAccess() or requireChildAccess({ allowChild: true })
const requireChildAccess = ({ allowChild = false } = {}) => (req, res, next) => {
  const childId = Number(req.params.id);
  const { id: userId, role } = req.user || {};

  let allowed = false;
  if (Number.isInteger(childId)) {
    if (role === 'parent') allowed = linksRepository.isParentOf(userId, childId);
    else if (role === 'specialist') allowed = linksRepository.isLinkedSpecialist(userId, childId);
    else if (role === 'child') allowed = allowChild && linksRepository.isChildAccountOf(userId, childId);
  }

  if (!allowed) return next(new HttpError(403, 'You are not allowed to access this child.'));
  req.childId = childId;
  next();
};

module.exports = { requireChildAccess };