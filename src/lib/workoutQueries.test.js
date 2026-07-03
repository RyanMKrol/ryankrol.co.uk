import { selectRecentActivity } from './workoutQueries';

const makeWorkout = (workoutDate) => ({ workoutDate });

describe('selectRecentActivity', () => {
  test('returns exactly `limit` items, most-recent-workoutDate-first, when more than limit exist', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-03-01'),
      makeWorkout('2024-02-01'),
    ];
    const result = selectRecentActivity(workouts, 2);
    expect(result).toHaveLength(2);
    expect(result[0].workoutDate).toBe('2024-03-01');
    expect(result[1].workoutDate).toBe('2024-02-01');
  });

  test('returns all workouts sorted desc when fewer than limit exist', () => {
    const workouts = [makeWorkout('2024-01-01'), makeWorkout('2024-02-01')];
    const result = selectRecentActivity(workouts, 10);
    expect(result).toHaveLength(2);
    expect(result[0].workoutDate).toBe('2024-02-01');
    expect(result[1].workoutDate).toBe('2024-01-01');
  });

  test('returns up to limit even when none fall within the last 30 days', () => {
    const workouts = [
      makeWorkout('2019-05-01'),
      makeWorkout('2019-04-01'),
      makeWorkout('2020-01-01'),
    ];
    const result = selectRecentActivity(workouts, 10);
    expect(result).toHaveLength(3);
    expect(result[0].workoutDate).toBe('2020-01-01');
  });

  test('filters out workouts missing workoutDate instead of crashing', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      { totalVolume: 100 },
      makeWorkout(undefined),
      makeWorkout('2024-02-01'),
    ];
    const result = selectRecentActivity(workouts, 10);
    expect(result).toHaveLength(2);
    expect(result.map(w => w.workoutDate)).toEqual(['2024-02-01', '2024-01-01']);
  });
});
