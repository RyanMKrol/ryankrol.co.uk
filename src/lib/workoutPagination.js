const DEFAULT_PAGE_SIZE = 10;

/**
 * Filter workouts by type using case-insensitive title substring match.
 * @param {Array} workouts - All workout objects (must have a `title` string field)
 * @param {string} filter - 'all' | 'push' | 'pull' | 'legs'
 * @returns {Array} Filtered workout array
 */
export function filterWorkouts(workouts, filter) {
  if (!filter || filter === 'all') return workouts;
  const lower = filter.toLowerCase();
  return workouts.filter(w => w.title.toLowerCase().includes(lower));
}

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
 * Slice workouts for the requested page, clamping out-of-range requests.
 * @param {Array} workouts - Already-filtered workouts
 * @param {number} page - 1-based page number (clamped to valid range)
 * @param {number} [pageSize]
 * @returns {{ items: Array, page: number, pageCount: number, total: number }}
 */
export function paginateWorkouts(workouts, page, pageSize = DEFAULT_PAGE_SIZE) {
  const pageCount = getPageCount(workouts.length, pageSize);
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: workouts.slice(start, start + pageSize),
    page: clampedPage,
    pageCount,
    total: workouts.length,
  };
}
