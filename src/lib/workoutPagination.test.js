import { filterWorkouts, getPageCount, paginateWorkouts } from './workoutPagination';

const makeWorkouts = (titles) => titles.map((title, i) => ({ id: String(i), title }));

describe('filterWorkouts', () => {
  const workouts = makeWorkouts([
    'Push Day A', 'Pull Day', 'Legs Session', 'push light', 'Full Body', 'PULL Heavy', 'LEGS power',
  ]);

  test('(a) filter=push returns only title-matching items, case-insensitively', () => {
    const result = filterWorkouts(workouts, 'push');
    expect(result.map(w => w.title)).toEqual(['Push Day A', 'push light']);
  });

  test('(a) filter=pull returns only pull-titled items', () => {
    const result = filterWorkouts(workouts, 'pull');
    expect(result.map(w => w.title)).toEqual(['Pull Day', 'PULL Heavy']);
  });

  test('(a) filter=legs returns only legs-titled items', () => {
    const result = filterWorkouts(workouts, 'legs');
    expect(result.map(w => w.title)).toEqual(['Legs Session', 'LEGS power']);
  });

  test('(d) filter=all returns the full set unfiltered', () => {
    expect(filterWorkouts(workouts, 'all')).toEqual(workouts);
  });

  test('(d) no filter returns the full set unfiltered', () => {
    expect(filterWorkouts(workouts, '')).toEqual(workouts);
  });
});

describe('getPageCount', () => {
  test('(b) page count = ceil(filtered.length / pageSize)', () => {
    expect(getPageCount(10, 10)).toBe(1);
    expect(getPageCount(11, 10)).toBe(2);
    expect(getPageCount(25, 10)).toBe(3);
    expect(getPageCount(0, 10)).toBe(1); // empty set → at least 1
  });
});

describe('paginateWorkouts', () => {
  const workouts = makeWorkouts(Array.from({ length: 25 }, (_, i) => `Workout ${i + 1}`));

  test('(b) returns correct page count', () => {
    const { pageCount } = paginateWorkouts(workouts, 1, 10);
    expect(pageCount).toBe(3);
  });

  test('returns correct slice for first page', () => {
    const { items, page } = paginateWorkouts(workouts, 1, 10);
    expect(items).toHaveLength(10);
    expect(items[0].title).toBe('Workout 1');
    expect(page).toBe(1);
  });

  test('returns correct slice for last partial page', () => {
    const { items } = paginateWorkouts(workouts, 3, 10);
    expect(items).toHaveLength(5);
  });

  test('(c) out-of-range page clamps to the last valid page', () => {
    const { page, items } = paginateWorkouts(workouts, 99, 10);
    expect(page).toBe(3);
    expect(items).toHaveLength(5);
  });

  test('(c) page 0 clamps to page 1', () => {
    const { page } = paginateWorkouts(workouts, 0, 10);
    expect(page).toBe(1);
  });
});
