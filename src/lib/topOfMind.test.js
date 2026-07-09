import { isExpired, daysSinceUpdate, daysRemaining, validateTopOfMindText, TTL_DAYS } from './topOfMind';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('isExpired', () => {
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');

  it('is not expired at exactly 90 days minus 1ms', () => {
    const now = new Date(updatedAt.getTime() + TTL_DAYS * DAY_MS - 1);
    expect(isExpired(updatedAt, now)).toBe(false);
  });

  it('is not expired exactly at the 90-day boundary', () => {
    const now = new Date(updatedAt.getTime() + TTL_DAYS * DAY_MS);
    expect(isExpired(updatedAt, now)).toBe(false);
  });

  it('is expired at 90 days plus 1ms', () => {
    const now = new Date(updatedAt.getTime() + TTL_DAYS * DAY_MS + 1);
    expect(isExpired(updatedAt, now)).toBe(true);
  });
});

describe('validateTopOfMindText', () => {
  it('rejects empty text', () => {
    expect(validateTopOfMindText('')).toBe(false);
  });

  it('rejects whitespace-only text', () => {
    expect(validateTopOfMindText('   \n\t  ')).toBe(false);
  });

  it('rejects over-length text', () => {
    expect(validateTopOfMindText('a'.repeat(20001))).toBe(false);
  });

  it('accepts normal markdown text', () => {
    expect(validateTopOfMindText('# Heading\n\nSome **bold** text')).toBe(true);
  });

  it('accepts text at the max length', () => {
    expect(validateTopOfMindText('a'.repeat(20000))).toBe(true);
  });
});

describe('daysSinceUpdate / daysRemaining', () => {
  it('reports ~10 days elapsed and ~80 days remaining', () => {
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date(updatedAt.getTime() + 10 * DAY_MS);
    expect(daysSinceUpdate(updatedAt, now)).toBeCloseTo(10, 5);
    expect(daysRemaining(updatedAt, now)).toBeCloseTo(80, 5);
  });
});
