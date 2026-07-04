/**
 * Decide whether a horizontally-scrollable container should show its
 * right-edge fade mask — only when there's overflow AND it isn't already
 * scrolled to the end.
 * @param {{ scrollWidth: number, clientWidth: number, scrollLeft: number, epsilon?: number }} params
 * @returns {boolean}
 */
export function shouldShowScrollFade({ scrollWidth, clientWidth, scrollLeft, epsilon = 1 }) {
  const hasOverflow = scrollWidth > clientWidth;
  const atEnd = scrollLeft + clientWidth >= scrollWidth - epsilon;
  return hasOverflow && !atEnd;
}
