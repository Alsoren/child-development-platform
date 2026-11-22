const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

// Today's local date as "YYYY-MM-DD".
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The date `weeks` weeks after (or before, if negative) the given "YYYY-MM-DD" date.
export function shiftWeeks(date, weeks) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + weeks * 7 * DAY_MS).toISOString().slice(0, 10);
}

// From "YYYY-MM-DD HH:MM".
export const dateOf = (dateTime) => dateTime.slice(0, 10);
export const timeOf = (dateTime) => dateTime.slice(11, 16);
