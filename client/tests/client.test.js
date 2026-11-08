// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiFetch } from '../src/api/client';

const mockResponse = (status, data) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(data) });

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'abc');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the token and returns the data', async () => {
    const fetch = mockResponse(200, { children: [] });
    vi.stubGlobal('fetch', fetch);

    await expect(apiFetch('/children')).resolves.toEqual({ children: [] });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/children');
    expect(options.method).toBe('GET');
    expect(options.headers.Authorization).toBe('Bearer abc');
    expect(options.body).toBeUndefined();
  });

  it('sends a JSON body', async () => {
    const fetch = mockResponse(201, { link: {} });
    vi.stubGlobal('fetch', fetch);

    await apiFetch('/children/1/specialists', { method: 'POST', body: { email: 'a@example.com' } });
    const [, options] = fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"email":"a@example.com"}');
  });

  it('throws the error message from the API', async () => {
    vi.stubGlobal('fetch', mockResponse(404, { error: 'No registered specialist with this email.' }));
    await expect(apiFetch('/x')).rejects.toThrow('No registered specialist with this email.');
  });

  it('throws a default message when the response has no error text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.reject() }));
    await expect(apiFetch('/x')).rejects.toThrow('Request failed');
  });

  it('logs the user out on 401', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    localStorage.setItem('user', '{}');
    vi.stubGlobal('fetch', mockResponse(401, { error: 'Invalid or expired token.' }));

    await expect(apiFetch('/x')).rejects.toThrow('Invalid or expired token.');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });
});