import { getPageCount, paginate } from './pagination';

const makeItems = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i), title: `Item ${i + 1}` }));

describe('getPageCount', () => {
  test('page count = ceil(total / pageSize)', () => {
    expect(getPageCount(10, 10)).toBe(1);
    expect(getPageCount(11, 10)).toBe(2);
    expect(getPageCount(25, 10)).toBe(3);
    expect(getPageCount(0, 10)).toBe(1); // empty set → at least 1
  });
});

describe('paginate', () => {
  test('exact page-size boundary produces full, evenly-sized pages', () => {
    const items = makeItems(20);
    const { items: page1, pageCount } = paginate(items, 1, 10);
    expect(pageCount).toBe(2);
    expect(page1).toHaveLength(10);
    expect(page1[0].title).toBe('Item 1');
    expect(page1[9].title).toBe('Item 10');
  });

  test('last page can be partial', () => {
    const items = makeItems(25);
    const { items: lastPage, page, pageCount, hasNext } = paginate(items, 3, 10);
    expect(pageCount).toBe(3);
    expect(page).toBe(3);
    expect(lastPage).toHaveLength(5);
    expect(hasNext).toBe(false);
  });

  test('out-of-range page number clamps to the last valid page', () => {
    const items = makeItems(25);
    const { page, items: pageItems } = paginate(items, 99, 10);
    expect(page).toBe(3);
    expect(pageItems).toHaveLength(5);
  });

  test('page number below 1 clamps to page 1', () => {
    const items = makeItems(25);
    const { page } = paginate(items, 0, 10);
    expect(page).toBe(1);
  });

  test('single-page case (fewer items than page size)', () => {
    const items = makeItems(4);
    const { items: pageItems, page, pageCount, hasNext, hasPrev } = paginate(items, 1, 10);
    expect(pageCount).toBe(1);
    expect(page).toBe(1);
    expect(pageItems).toHaveLength(4);
    expect(hasNext).toBe(false);
    expect(hasPrev).toBe(false);
  });
});
