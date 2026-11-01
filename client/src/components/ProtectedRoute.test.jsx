// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getUser } from './ProtectedRoute';

describe('getUser', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nobody is logged in', () => {
    expect(getUser()).toBeNull();
  });

  it('returns the stored user', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'parent' }));
    expect(getUser()).toEqual({ id: 1, role: 'parent' });
  });

  it('returns null when the stored value is not valid JSON', () => {
    localStorage.setItem('user', '{not json');
    expect(getUser()).toBeNull();
  });
});
