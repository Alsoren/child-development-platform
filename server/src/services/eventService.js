const eventsRepository = require('../repositories/eventsRepository');
const HttpError = require('../utils/httpError');

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDate = (date) => date.toISOString().slice(0, 10);

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

// Returns a UTC Date for "YYYY-MM-DD", or null if it is not a real date.
function parseDate(value) {
  if (typeof value !== 'string') return null;
  const m = DATE_ONLY.exec(value);
  if (!m) return null;
  const [y, mo, d] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  const isReal = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return isReal ? date : null;
}

function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// The Monday to Sunday week (SRS A6) that contains the given date, or null if the date is invalid.
function weekRange(value = today()) {
  const date = parseDate(value);
  if (!date) return null;
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date.getTime() - sinceMonday * DAY_MS);
  return {
    weekStart: toIsoDate(monday),
    weekEnd: toIsoDate(new Date(monday.getTime() + 6 * DAY_MS)),
    nextWeekStart: toIsoDate(new Date(monday.getTime() + 7 * DAY_MS)),
  };
}

// Parent of the child, or a specialist currently linked to the child (US-M3-01, US-M3-02).
// "No such child" and "not your child" give the same answer, so ids cannot be probed.
function assertCanManageEvents(user, childId) {
  if (!user) throw new HttpError(401, 'Authentication required.');
  const allowed =
    Number.isInteger(childId) &&
    ((user.role === 'parent' && eventsRepository.isParentOf(user.id, childId)) ||
      (user.role === 'specialist' && eventsRepository.isLinkedSpecialist(user.id, childId)));
  if (!allowed) throw new HttpError(403, "You are not allowed to access this child's events.");
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
  assertCanManageEvents(user, childId);

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
  assertCanManageEvents(user, childId);

  const range = weekRange(week);
  if (!range) throw new HttpError(400, 'Week must be a date (YYYY-MM-DD).');

  const rows = eventsRepository.findInRange(childId, `${range.weekStart} 00:00`, `${range.nextWeekStart} 00:00`);
  return { weekStart: range.weekStart, weekEnd: range.weekEnd, events: rows.map(toEvent) };
}

module.exports = { createEvent, listWeek };
