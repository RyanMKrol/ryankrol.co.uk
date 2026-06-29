/**
 * toTimeSeries — map an array of rows to {x, y} points for a chart.js `time` scale.
 * Rows with a missing or blank date are silently dropped.
 * Output is sorted ascending by date.
 *
 * @param {Array} rows
 * @param {function} getDate  row → date string (ISO or any Date-parseable format)
 * @param {function} getValue row → numeric y value
 * @returns {{x: number, y: number}[]}
 */
export function toTimeSeries(rows, getDate, getValue) {
  return rows
    .reduce((acc, row) => {
      const raw = getDate(row);
      if (!raw && raw !== 0) return acc;
      const ts = new Date(raw).getTime();
      if (isNaN(ts)) return acc;
      acc.push({ x: ts, y: getValue(row) });
      return acc;
    }, [])
    .sort((a, b) => a.x - b.x);
}

/**
 * timeScaleOptions — shared chart.js x-axis fragment for a time scale.
 * Merge into your chart `scales.x` alongside theme colour/font overrides.
 */
export const timeScaleOptions = {
  type: 'time',
  time: {
    tooltipFormat: 'MMM d, yyyy',
    displayFormats: {
      day: 'MMM d',
      week: 'MMM d',
      month: 'MMM yyyy',
      year: 'yyyy'
    }
  }
};
