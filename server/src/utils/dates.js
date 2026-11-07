const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const toIsoDate = (date) => date.toISOString().slice(0, 10);

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

// Today's local date as "YYYY-MM-DD".
function today() {
  const now = new Date();
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

module.exports = { parseDate, today, weekRange, pad };
