const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

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

module.exports = { parseDate };
