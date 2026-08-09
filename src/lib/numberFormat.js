/**
 * Compact display formatting for large numbers, e.g. the home gym panel's volume stats.
 * Keeping big values short ("982k" not "982,340") means they always fit on one line in a
 * narrow panel, so the layout can't reflow when real data replaces a loading placeholder.
 */
export function formatCompactNumber(value) {
  if (value == null || Number.isNaN(value)) return null;
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${trimTrailingZero((value / 1e6).toFixed(2))}m`;
  if (abs >= 1e5) return `${Math.round(value / 1e3)}k`;
  if (abs >= 1e4) return `${trimTrailingZero((value / 1e3).toFixed(1))}k`;
  return value.toLocaleString();
}

function trimTrailingZero(numeric) {
  return numeric.replace(/\.?0+$/, '');
}
