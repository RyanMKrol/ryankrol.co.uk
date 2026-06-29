export const DATE_RANGES = [
  { key: '3m', label: '3 months', months: 3 },
  { key: '1y', label: '1 year', months: 12 },
  { key: 'all', label: 'All time', months: null },
];

export function filterByDateRange(items, rangeKey, getDate, now = new Date()) {
  const range = DATE_RANGES.find((r) => r.key === rangeKey);
  if (!range || range.months === null) return items;

  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - range.months);

  return items.filter((item) => {
    const d = getDate(item);
    return d instanceof Date ? d >= cutoff : new Date(d) >= cutoff;
  });
}
