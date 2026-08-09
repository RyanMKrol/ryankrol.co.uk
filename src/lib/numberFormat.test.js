import { formatCompactNumber } from './numberFormat';

describe('formatCompactNumber', () => {
  it('returns null for null/undefined/NaN', () => {
    expect(formatCompactNumber(null)).toBeNull();
    expect(formatCompactNumber(undefined)).toBeNull();
    expect(formatCompactNumber(NaN)).toBeNull();
  });

  it('renders small values with locale separators', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(142)).toBe('142');
    expect(formatCompactNumber(9999)).toBe('9,999');
  });

  it('renders 10k–99k values with one decimal', () => {
    expect(formatCompactNumber(11200)).toBe('11.2k');
    expect(formatCompactNumber(10000)).toBe('10k');
    expect(formatCompactNumber(99940)).toBe('99.9k');
  });

  it('renders 100k+ values as whole k', () => {
    expect(formatCompactNumber(982340)).toBe('982k');
    expect(formatCompactNumber(100499)).toBe('100k');
  });

  it('renders millions with up to two decimals', () => {
    expect(formatCompactNumber(1234567)).toBe('1.23m');
    expect(formatCompactNumber(2000000)).toBe('2m');
    expect(formatCompactNumber(1500000)).toBe('1.5m');
  });
});
