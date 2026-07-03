const {
  isMissingExercises,
  reshapeExerciseRows,
  buildMetricsUpdate,
} = require('./backfillIncompleteWorkoutMetrics');

const { calculateWorkoutMetrics } = require('../lib/workoutMetrics');

function set({ type = 'normal', weight = null, reps = null } = {}) {
  return { type, weight_kg: weight, reps, distance_meters: null, duration_seconds: null };
}

describe('isMissingExercises', () => {
  it('flags a workout missing the denormalized exercises field', () => {
    expect(isMissingExercises({ id: 'w1', title: 'Push Day' })).toBe(true);
  });

  it('does not flag a workout that already has exercises', () => {
    expect(isMissingExercises({ id: 'w1', exercises: [] })).toBe(false);
  });
});

describe('reshapeExerciseRows', () => {
  it('sorts by index and maps Exercises-table rows to workout.exercises shape', () => {
    const rows = [
      { index: 1, title: 'Bench Press', sets: [set({ weight: 100, reps: 5 })] },
      { index: 0, title: 'Squat', sets: [set({ weight: 120, reps: 5 })] },
    ];

    expect(reshapeExerciseRows(rows)).toEqual([
      { title: 'Squat', sets: rows[1].sets },
      { title: 'Bench Press', sets: rows[0].sets },
    ]);
  });

  it('falls back to the older exercise_name/exercise_index fields for rows predating the schema change', () => {
    const rows = [
      { exercise_index: 1, exercise_name: 'Bench Press', sets: [set({ weight: 100, reps: 5 })] },
      { exercise_index: 0, exercise_name: 'Squat', sets: [set({ weight: 120, reps: 5 })] },
    ];

    expect(reshapeExerciseRows(rows)).toEqual([
      { title: 'Squat', sets: rows[1].sets },
      { title: 'Bench Press', sets: rows[0].sets },
    ]);
  });

  it('handles a workout with a mix of old-shape and new-shape exercise rows', () => {
    const rows = [
      { index: 0, title: 'Hack Squat', sets: [set({ weight: 100, reps: 5 })] },
      { exercise_index: 1, exercise_name: 'Curl', sets: [set({ weight: 10, reps: 12 })] },
    ];

    expect(reshapeExerciseRows(rows)).toEqual([
      { title: 'Hack Squat', sets: rows[0].sets },
      { title: 'Curl', sets: rows[1].sets },
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

  const exercises = [
    {
      title: 'Bench Press',
      sets: [
        set({ type: 'warmup', weight: 40, reps: 10 }),
        set({ weight: 100, reps: 5 }),
        set({ weight: 100, reps: 5 }),
      ],
    },
    {
      title: 'Overhead Press',
      sets: [
        set({ weight: 50, reps: 8 }),
      ],
    },
  ];

  it('spreads the ENTIRE calculateWorkoutMetrics output, not a hand-picked subset', () => {
    const expectedMetrics = calculateWorkoutMetrics({
      start_time: workoutItem.start_time,
      end_time: workoutItem.end_time,
      exercises,
    });

    const update = buildMetricsUpdate(workoutItem, exercises);

    expect(update).toEqual({ exercises, ...expectedMetrics });
    // Explicitly guard the exact field that went missing in production - a hand-picked
    // field list previously dropped this even though calculateWorkoutMetrics computes it.
    expect(update).toHaveProperty('workoutDate');
    expect(update.workoutDate).toBe('2026-01-01');
    expect(update).toHaveProperty('strengthExercises');
    expect(update).toHaveProperty('cardioExercises');
    expect(update).toHaveProperty('totalDistance');
    expect(update).toHaveProperty('totalDuration');
  });

  it('computes metrics matching calculateWorkoutMetrics called directly', () => {
    const update = buildMetricsUpdate(workoutItem, exercises);

    expect(update.totalWorkingSets).toBe(3);
    expect(update.totalWarmupSets).toBe(1);
    expect(update.uniqueExercises).toBe(2);
    expect(update.durationMinutes).toBe(60);
    expect(update.workoutType).toBe('strength');
  });
});
