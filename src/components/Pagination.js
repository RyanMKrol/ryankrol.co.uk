import Pill from './Pill';

/**
 * Build the list of page numbers/ellipsis markers to render, always keeping
 * the first page, the last page, and a window around the current page.
 * @param {number} currentPage
 * @param {number} totalPages
 * @returns {Array<number|'ellipsis'>}
 */
function buildPageItems(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  });
  return items;
}

/**
 * Numbered page pills + ellipsis + a "next →" pill. Controlled component —
 * the page state itself lives in the parent.
 */
export default function Pagination({ currentPage, totalPages, onPageChange, accentColor }) {
  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="collection-pagination">
      {pageItems.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="collection-pagination-ellipsis">
            …
          </span>
        ) : (
          <Pill
            key={item}
            active={item === currentPage}
            accentColor={accentColor}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Pill>
        )
      )}
      <Pill
        accentColor={accentColor}
        onClick={() => onPageChange(currentPage + 1)}
      >
        next →
      </Pill>
    </div>
  );
}
