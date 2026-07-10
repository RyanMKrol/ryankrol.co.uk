/**
 * Strip a leading "<Series> <Number>: " prefix from a book title, so bulk-backfill search
 * queries the book's own subtitle instead of the whole series-prefixed title — e.g. "The Horus
 * Heresy 41: The Master of Mankind" searches upstream providers as just "The Master of Mankind",
 * which they match far more reliably than the full series-prefixed title.
 */
export function stripSeriesPrefix(title) {
  const match = title.match(/^.+?\s+\d+:\s*(.+)$/);
  return match ? match[1] : title;
}
