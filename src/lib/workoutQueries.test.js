import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo';

jest.mock('./dynamo', () => ({
  ...jest.requireActual('./dynamo'),
  docClient: { send: jest.fn() }
}));

import { bucketVolumeByMonth, getBestPriorMetrics } from './workoutQueries';

const makeWorkout = (workoutDate, totalVolume) => ({ workoutDate, totalVolume });

describe('getBestPriorMetrics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when there are no prior rows for the exercise', async () => {
    docClient.send.mockResolvedValue({ Items: [] });
    const result = await getBestPriorMetrics('Bench Press', '2026-06-01');
    expect(result).toBeNull();
  });

  it('reduces multiple prior rows to the max of each axis, ignoring rows missing that field', async () => {
    docClient.send.mockImplementation((cmd) => {
      expect(cmd).toBeInstanceOf(QueryCommand);
      return Promise.resolve({
        Items: [
          { heaviestWeight: 80, bestEstimated1RM: 100, bestSetVolume: 900 },
          { heaviestWeight: 100, bestEstimated1RM: 90 }, // no bestSetVolume (pre-T289 row)
          { heaviestWeight: 70, bestEstimated1RM: 120, bestSetVolume: 950 },
        ]
      });
    });

    const result = await getBestPriorMetrics('Bench Press', '2026-06-01');

    expect(result).toEqual({ heaviestWeight: 100, bestEstimated1RM: 120, bestSetVolume: 950 });
  });

  it('paginates using ExclusiveStartKey until LastEvaluatedKey is absent', async () => {
    docClient.send
      .mockResolvedValueOnce({ Items: [{ heaviestWeight: 50 }], LastEvaluatedKey: { exercise_id: 'a' } })
      .mockResolvedValueOnce({ Items: [{ heaviestWeight: 60 }] });

    const result = await getBestPriorMetrics('Bench Press', '2026-06-01');

    expect(docClient.send).toHaveBeenCalledTimes(2);
    expect(result.heaviestWeight).toBe(60);
  });
});

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
