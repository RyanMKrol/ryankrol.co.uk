import { DATE_RANGES, filterByDateRange } from './dateRange';

const NOW = new Date('2025-06-15T00:00:00Z');

const items = [
  { date: new Date('2025-06-14T00:00:00Z'), label: 'yesterday' },
  { date: new Date('2025-03-15T00:00:00Z'), label: 'exactly 3 months ago' },
  { date: new Date('2025-03-14T00:00:00Z'), label: 'just outside 3m' },
  { date: new Date('2024-06-15T00:00:00Z'), label: 'exactly 1 year ago' },
  { date: new Date('2024-06-14T00:00:00Z'), label: 'just outside 1y' },
  { date: new Date('2020-01-01T00:00:00Z'), label: 'old' },
];

const getDate = (item) => item.date;

describe('DATE_RANGES', () => {
  it('exports three entries with the expected keys', () => {
    expect(DATE_RANGES.map((r) => r.key)).toEqual(['3m', '1y', 'all']);
  });

  it('all entry has months: null', () => {
    expect(DATE_RANGES.find((r) => r.key === 'all').months).toBeNull();
  });
});

describe('filterByDateRange', () => {
  it('3m includes items on or after the cutoff and excludes older', () => {
    const result = filterByDateRange(items, '3m', getDate, NOW);
    const labels = result.map((i) => i.label);
    expect(labels).toContain('yesterday');
    expect(labels).toContain('exactly 3 months ago');
    expect(labels).not.toContain('just outside 3m');
    expect(labels).not.toContain('old');
  });

  it('1y includes items on or after the 1-year cutoff and excludes older', () => {
    const result = filterByDateRange(items, '1y', getDate, NOW);
    const labels = result.map((i) => i.label);
    expect(labels).toContain('yesterday');
    expect(labels).toContain('exactly 3 months ago');
    expect(labels).toContain('exactly 1 year ago');
    expect(labels).not.toContain('just outside 1y');
    expect(labels).not.toContain('old');
  });

  it('all returns every item', () => {
    const result = filterByDateRange(items, 'all', getDate, NOW);
    expect(result).toHaveLength(items.length);
  });

  it('unknown key returns all items (falls back to all)', () => {
    const result = filterByDateRange(items, 'unknown', getDate, NOW);
    expect(result).toHaveLength(items.length);
  });

  it('accepts ISO string dates from getDate', () => {
    const strItems = [
      { date: '2025-06-14T00:00:00Z', label: 'recent' },
      { date: '2020-01-01T00:00:00Z', label: 'old' },
    ];
    const result = filterByDateRange(strItems, '3m', (i) => i.date, NOW);
    expect(result.map((i) => i.label)).toEqual(['recent']);
  });
});
