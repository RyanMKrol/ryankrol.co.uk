const {
  isIncomplete,
  reshapeExerciseRows,
  buildMetricsUpdate,
} = require('./backfillIncompleteWorkoutMetrics');

const { calculateWorkoutMetrics } = require('../lib/workoutMetrics');

function set({ type = 'normal', weight = null, reps = null } = {}) {
  return { type, weight_kg: weight, reps, distance_meters: null, duration_seconds: null };
}

describe('isIncomplete', () => {
  it('flags a workout missing the denormalized exercises field', () => {
    expect(isIncomplete({ id: 'w1', title: 'Push Day' })).toBe(true);
  });

  it('does not flag a workout that already has exercises', () => {
    expect(isIncomplete({ id: 'w1', exercises: [] })).toBe(false);
  });
});

describe('reshapeExerciseRows', () => {
  it('sorts by exercise_index and maps Exercises-table rows to workout.exercises shape', () => {
    const rows = [
      { exercise_index: 1, exercise_name: 'Bench Press', sets: [set({ weight: 100, reps: 5 })] },
      { exercise_index: 0, exercise_name: 'Squat', sets: [set({ weight: 120, reps: 5 })] },
    ];

    expect(reshapeExerciseRows(rows)).toEqual([
      { title: 'Squat', sets: rows[1].sets },
      { title: 'Bench Press', sets: rows[0].sets },
    ]);
  });
});

describe('buildMetricsUpdate', () => {
  const workoutItem = {
    id: '5c4249f9-bd32-44ff-b7a5-b3edf05303f6',
    title: 'Push Day',
    start_time: '2026-01-01T10:00:00.000Z',
    end_time: '2026-01-01T11:00:00.000Z',
  };

  const exerciseRows = [
    {
      exercise_index: 0,
      exercise_name: 'Bench Press',
      sets: [
        set({ type: 'warmup', weight: 40, reps: 10 }),
        set({ weight: 100, reps: 5 }),
        set({ weight: 100, reps: 5 }),
      ],
    },
    {
      exercise_index: 1,
      exercise_name: 'Overhead Press',
      sets: [
        set({ weight: 50, reps: 8 }),
      ],
    },
  ];

  it('computes metrics matching calculateWorkoutMetrics called directly on the reshaped exercises', () => {
    const expectedExercises = reshapeExerciseRows(exerciseRows);
    const expectedMetrics = calculateWorkoutMetrics({
      start_time: workoutItem.start_time,
      end_time: workoutItem.end_time,
      exercises: expectedExercises,
    });

    const update = buildMetricsUpdate(workoutItem, exerciseRows);

    expect(update).toEqual({
      exercises: expectedExercises,
      totalVolume: expectedMetrics.totalVolume,
      totalWarmupSets: expectedMetrics.totalWarmupSets,
      totalWorkingSets: expectedMetrics.totalWorkingSets,
      uniqueExercises: expectedMetrics.uniqueExercises,
      durationMinutes: expectedMetrics.durationMinutes,
      workoutType: expectedMetrics.workoutType,
    });

    expect(update.totalWorkingSets).toBe(3);
    expect(update.totalWarmupSets).toBe(1);
    expect(update.uniqueExercises).toBe(2);
    expect(update.durationMinutes).toBe(60);
    expect(update.workoutType).toBe('strength');
  });
});
