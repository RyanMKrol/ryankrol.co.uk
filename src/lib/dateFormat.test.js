import { formatEnglishDate, formatReviewDate } from './dateFormat';

describe('formatEnglishDate', () => {
  it('formats a plain Date object', () => {
    expect(formatEnglishDate(new Date(2026, 4, 17))).toBe('17 May 2026');
  });

  it('formats an ISO string', () => {
    expect(formatEnglishDate('2026-05-17T00:00:00.000Z')).toBe('17 May 2026');
  });

  it('returns empty string for falsy input', () => {
    expect(formatEnglishDate(null)).toBe('');
    expect(formatEnglishDate(undefined)).toBe('');
    expect(formatEnglishDate('')).toBe('');
  });

  it('returns empty string for an unparseable date', () => {
    expect(formatEnglishDate('not-a-date')).toBe('');
  });
});

describe('formatReviewDate', () => {
  it('formats a valid DD-MM-YYYY string', () => {
    expect(formatReviewDate('17-05-2026')).toBe('17 May 2026');
  });

  it('formats a single-digit day/month input', () => {
    expect(formatReviewDate('5-3-2026')).toBe('5 March 2026');
  });

  it('returns empty string for falsy input', () => {
    expect(formatReviewDate(null)).toBe('');
    expect(formatReviewDate(undefined)).toBe('');
    expect(formatReviewDate('')).toBe('');
  });

  it('returns empty string for malformed input', () => {
    expect(formatReviewDate('2026-05')).toBe('');
    expect(formatReviewDate('a-b-c')).toBe('');
  });
});
