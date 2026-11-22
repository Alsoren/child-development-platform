import { describe, it, expect } from 'vitest';
import { dateOf, shiftWeeks, timeOf, today } from './week';

describe('shiftWeeks', () => {
  it('moves forward and backward by whole weeks', () => {
    expect(shiftWeeks('2026-11-18', 1)).toBe('2026-11-25');
    expect(shiftWeeks('2026-11-18', -1)).toBe('2026-11-11');
  });

  it('crosses a month and a year boundary', () => {
    expect(shiftWeeks('2026-12-28', 1)).toBe('2027-01-04');
    expect(shiftWeeks('2027-01-04', -1)).toBe('2026-12-28');
  });
});

describe('dateOf and timeOf', () => {
  it('split "YYYY-MM-DD HH:MM"', () => {
    expect(dateOf('2026-11-09 16:30')).toBe('2026-11-09');
    expect(timeOf('2026-11-09 16:30')).toBe('16:30');
  });
});

describe('today', () => {
  it('returns a YYYY-MM-DD date', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
