const DEFAULT_PAGE_SIZE = 10;

/**
 * Compute total page count.
 * @param {number} total - Total number of items
 * @param {number} [pageSize]
 * @returns {number} At least 1
 */
export function getPageCount(total, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Slice any array for the requested page, clamping out-of-range requests.
 * @param {Array} items - Already-filtered/sorted items
 * @param {number} page - 1-based page number (clamped to valid range)
 * @param {number} [pageSize]
 * @returns {{ items: Array, page: number, pageCount: number, total: number, hasNext: boolean, hasPrev: boolean }}
 */
export function paginate(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const pageCount = getPageCount(items.length, pageSize);
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: clampedPage,
    pageCount,
    total: items.length,
    hasNext: clampedPage < pageCount,
    hasPrev: clampedPage > 1,
  };
}
