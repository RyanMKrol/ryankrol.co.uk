import { bucketVolumeByMonth } from './workoutQueries';

const makeWorkout = (workoutDate, totalVolume) => ({ workoutDate, totalVolume });

describe('bucketVolumeByMonth', () => {
  test('returns one bucket per trailing month, oldest first, ending on `now`', () => {
    const now = new Date(2026, 6, 3); // 3 Jul 2026
    const buckets = bucketVolumeByMonth([], 12, now);
    expect(buckets).toHaveLength(12);
    expect(buckets[0].month).toBe('2025-08');
    expect(buckets[0].label).toBe('Aug 2025');
    expect(buckets[11].month).toBe('2026-07');
    expect(buckets[11].label).toBe('Jul 2026');
  });

  test('sums totalVolume per calendar month', () => {
    const now = new Date(2026, 6, 3);
    const workouts = [
      makeWorkout('2026-07-01', 100),
      makeWorkout('2026-07-15', 50),
      makeWorkout('2026-06-10', 200),
    ];
    const buckets = bucketVolumeByMonth(workouts, 12, now);
    expect(buckets.find((b) => b.month === '2026-07').totalVolume).toBe(150);
    expect(buckets.find((b) => b.month === '2026-06').totalVolume).toBe(200);
  });

  test('leaves months with no workouts at zero volume', () => {
    const now = new Date(2026, 6, 3);
    const buckets = bucketVolumeByMonth([], 12, now);
    expect(buckets.every((b) => b.totalVolume === 0)).toBe(true);
  });

  test('ignores workouts outside the requested window and missing workoutDate', () => {
    const now = new Date(2026, 6, 3);
    const workouts = [
      makeWorkout('2020-01-01', 999),
      { totalVolume: 500 },
      makeWorkout('2026-07-01', 42),
    ];
    const buckets = bucketVolumeByMonth(workouts, 12, now);
    const total = buckets.reduce((sum, b) => sum + b.totalVolume, 0);
    expect(total).toBe(42);
  });
});
