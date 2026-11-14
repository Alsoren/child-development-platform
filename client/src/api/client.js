// Shared fetch for the app's API: adds the JWT and turns error responses into Error(message).
// A 401 means the token is missing or expired, so the user is sent back to the login page.
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.assign('/login');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}