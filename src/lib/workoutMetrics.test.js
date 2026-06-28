import {
  calculateEstimated1RM,
  calculateExerciseMetrics,
  calculateWorkoutMetrics,
} from './workoutMetrics';

// Helper to build a Hevy-shaped set with all four measurable fields present
// (null where not applicable, matching how the Hevy API delivers them).
function set({ type = 'normal', weight = null, reps = null, distance = null, duration = null } = {}) {
  return {
    type,
    weight_kg: weight,
    reps,
    distance_meters: distance,
    duration_seconds: duration,
  };
}

describe('calculateEstimated1RM (Epley)', () => {
  it('returns the raw weight for a single rep', () => {
    expect(calculateEstimated1RM(100, 1)).toBe(100);
  });

  it('applies the Epley formula and rounds to 1 decimal', () => {
    // 100 * (1 + 10/30) = 133.33… -> 133.3
    expect(calculateEstimated1RM(100, 10)).toBe(133.3);
    // 60 * (1 + 5/30) = 70.0
    expect(calculateEstimated1RM(60, 5)).toBe(70);
  });
});

describe('calculateExerciseMetrics', () => {
  it('classifies a weighted exercise as strength and computes volume/1RM', () => {
    const exercise = {
      sets: [
        set({ type: 'warmup', weight: 40, reps: 10 }),
        set({ weight: 100, reps: 5 }),
        set({ weight: 100, reps: 5 }),
      ],
    };

    const m = calculateExerciseMetrics(exercise);

    expect(m.exerciseType).toBe('strength');
    expect(m.totalWorkingSets).toBe(2);
    expect(m.totalWarmupSets).toBe(1);
    // sessionVolume includes the warmup set: 40*10 + 100*5 + 100*5 = 1400
    expect(m.sessionVolume).toBe(1400);
    // workingSetVolume excludes warmups: 100*5 + 100*5 = 1000
    expect(m.workingSetVolume).toBe(1000);
    expect(m.heaviestWeight).toBe(100);
    // best 1RM = 100 * (1 + 5/30) = 116.7
    expect(m.bestEstimated1RM).toBe(116.7);
    // averageWeight = workingSetVolume / totalReps = 1000 / 10
    expect(m.averageWeight).toBe(100);
    expect(m.totalDistance).toBeNull();
  });

  it('classifies a distance/duration exercise as cardio with null weight metrics', () => {
    const exercise = { sets: [set({ distance: 5000, duration: 1800 })] };

    const m = calculateExerciseMetrics(exercise);

    expect(m.exerciseType).toBe('cardio');
    expect(m.sessionVolume).toBe(0);
    expect(m.heaviestWeight).toBeNull();
    expect(m.bestEstimated1RM).toBeNull();
    expect(m.averageWeight).toBeNull();
    expect(m.totalDistance).toBe(5000);
    expect(m.totalDuration).toBe(1800);
  });

  it('classifies a reps-only exercise as bodyweight', () => {
    const exercise = { sets: [set({ reps: 10 })] };

    const m = calculateExerciseMetrics(exercise);

    expect(m.exerciseType).toBe('bodyweight');
    expect(m.sessionVolume).toBe(0);
    expect(m.heaviestWeight).toBeNull();
  });
});

describe('calculateWorkoutMetrics', () => {
  it('classifies a strength + cardio workout as mixed and aggregates totals', () => {
    const workout = {
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      exercises: [
        { sets: [set({ weight: 100, reps: 5 })] }, // strength
        { sets: [set({ distance: 5000, duration: 1800 })] }, // cardio
      ],
    };

    const m = calculateWorkoutMetrics(workout);

    expect(m.workoutType).toBe('mixed');
    expect(m.totalVolume).toBe(500);
    expect(m.uniqueExercises).toBe(2);
    expect(m.strengthExercises).toBe(1);
    expect(m.cardioExercises).toBe(1);
    expect(m.totalWorkingSets).toBe(2);
    expect(m.totalWarmupSets).toBe(0);
    expect(m.durationMinutes).toBe(60);
    expect(m.workoutDate).toBe('2024-01-15');
    expect(m.totalDistance).toBe(5000);
    expect(m.totalDuration).toBe(1800);
  });

  it('classifies a weights-only workout as strength', () => {
    const workout = {
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T10:45:00Z',
      exercises: [{ sets: [set({ weight: 80, reps: 8 })] }],
    };

    expect(calculateWorkoutMetrics(workout).workoutType).toBe('strength');
  });
});
