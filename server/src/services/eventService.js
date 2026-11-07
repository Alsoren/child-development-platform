const eventsRepository = require('../repositories/eventsRepository');
const HttpError = require('../utils/httpError');
const { today, weekRange, pad } = require('../utils/dates');

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

const UPCOMING_LIMIT = 20;

// Accepts "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM" (datetime-local input).
// Returns "YYYY-MM-DD HH:MM", or null if it is not a real date and time.
function normalizeDateTime(value) {
  if (typeof value !== 'string') return null;
  const m = DATE_TIME.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const isReal =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d &&
    date.getUTCHours() === h &&
    date.getUTCMinutes() === mi;
  return isReal ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}` : null;
}

// Local time as "YYYY-MM-DD HH:MM", the same format as events.start_at.
function currentDateTime() {
  const now = new Date();
  return `${today()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// The parent of the child and a specialist currently linked to the child. With allowChild,
// also the child's own account (US-M3-01 to US-M3-03).
// "No such child" and "not your child" give the same answer, so ids cannot be probed.
function hasAccess(user, childId, allowChild) {
  if (!Number.isInteger(childId)) return false;
  if (user.role === 'parent') return eventsRepository.isParentOf(user.id, childId);
  if (user.role === 'specialist') return eventsRepository.isLinkedSpecialist(user.id, childId);
  if (user.role === 'child') return allowChild && eventsRepository.isChildAccountOf(user.id, childId);
  return false;
}

function assertCanAccessEvents(user, childId, { allowChild = false } = {}) {
  if (!user) throw new HttpError(401, 'Authentication required.');
  if (!hasAccess(user, childId, allowChild)) {
    throw new HttpError(403, "You are not allowed to access this child's events.");
  }
}

const toEvent = (row) => ({
  id: row.id,
  childId: row.child_id,
  createdBy: row.created_by,
  title: row.title,
  startAt: row.start_at,
  endAt: row.end_at,
});

function createEvent(user, childIdParam, body) {
  const childId = Number(childIdParam);
  assertCanAccessEvents(user, childId);

  const { title, startAt, endAt } = body || {};
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (!cleanTitle) throw new HttpError(400, 'Title is required.');

  const start = normalizeDateTime(startAt);
  if (!start) throw new HttpError(400, 'Start must be a valid date and time (YYYY-MM-DD HH:MM).');
  const end = normalizeDateTime(endAt);
  if (!end) throw new HttpError(400, 'End must be a valid date and time (YYYY-MM-DD HH:MM).');
  if (end <= start) throw new HttpError(400, 'End time must be after the start time.');

  const row = eventsRepository.insert({ childId, createdBy: user.id, title: cleanTitle, startAt: start, endAt: end });
  return toEvent(row);
}

// Events of the week that contains `week` (any date in it, default: this week), ordered by date and time.
function listWeek(user, childIdParam, week) {
  const childId = Number(childIdParam);
  assertCanAccessEvents(user, childId);

  const range = weekRange(week);
  if (!range) throw new HttpError(400, 'Week must be a date (YYYY-MM-DD).');

  const rows = eventsRepository.findInRange(childId, `${range.weekStart} 00:00`, `${range.nextWeekStart} 00:00`);
  return { weekStart: range.weekStart, weekEnd: range.weekEnd, events: rows.map(toEvent) };
}

// Events that have not ended yet, soonest first, at most UPCOMING_LIMIT. Also open to the child's own account (US-M3-03).
function listUpcoming(user, childIdParam, now = currentDateTime()) {
  const childId = Number(childIdParam);
  assertCanAccessEvents(user, childId, { allowChild: true });

  return { events: eventsRepository.findUpcoming(childId, now, UPCOMING_LIMIT).map(toEvent) };
}

module.exports = { createEvent, listWeek, listUpcoming };
