const linksRepository = require('../repositories/linksRepository');
const HttpError = require('../utils/httpError');

const SPECIALIST_TYPES = ['teacher', 'psychologist', 'doctor', 'special education teacher', 'coach'];

// US-M2-01: the parent links a registered specialist to the child by email and type.
// Access (parent role, owner of the child) is checked by the middleware before this runs.
function linkSpecialist(childId, body) {
  const { email, type } = body || {};

  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail) throw new HttpError(400, 'Email is required.');

  if (!SPECIALIST_TYPES.includes(type)) {
    throw new HttpError(400, `Type must be one of: ${SPECIALIST_TYPES.join(', ')}.`);
  }

  // Same answer for "no account" and "account is not a specialist".
  const specialist = linksRepository.findSpecialistByEmail(cleanEmail);
  if (!specialist) throw new HttpError(404, 'No registered specialist with this email.');

  if (linksRepository.findLink(childId, specialist.id)) {
    throw new HttpError(409, 'This specialist is already linked to the child.');
  }

  return linksRepository.insert({ childId, specialistId: specialist.id, type });
}

module.exports = { linkSpecialist, SPECIALIST_TYPES };