import { toTimeSeries } from './chartTime';

describe('toTimeSeries', () => {
  const rows = [
    { date: '2024-03-15', value: 10 },
    { date: '2024-01-01', value: 5 },
    { date: '2024-06-20', value: 20 }
  ];

  it('maps rows to {x, y} objects', () => {
    const result = toTimeSeries(rows, r => r.date, r => r.value);
    result.forEach(pt => {
      expect(typeof pt.x).toBe('number');
      expect(typeof pt.y).toBe('number');
    });
  });

  it('x is a numeric UTC timestamp', () => {
    const result = toTimeSeries(rows, r => r.date, r => r.value);
    result.forEach(pt => {
      expect(pt.x).toBeGreaterThan(0);
      expect(Number.isInteger(pt.x)).toBe(true);
    });
  });

  it('sorts ascending by date regardless of input order', () => {
    const result = toTimeSeries(rows, r => r.date, r => r.value);
    expect(result.map(p => p.y)).toEqual([5, 10, 20]);
  });

  it('drops rows with a missing date', () => {
    const withMissing = [...rows, { date: null, value: 99 }, { date: '', value: 88 }];
    const result = toTimeSeries(withMissing, r => r.date, r => r.value);
    expect(result).toHaveLength(3);
  });

  it('drops rows with an unparseable date', () => {
    const withBad = [...rows, { date: 'not-a-date', value: 7 }];
    const result = toTimeSeries(withBad, r => r.date, r => r.value);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array for empty input', () => {
    expect(toTimeSeries([], r => r.date, r => r.value)).toEqual([]);
  });
});
