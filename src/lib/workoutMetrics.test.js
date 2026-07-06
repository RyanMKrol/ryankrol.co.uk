import {
  calculateEstimated1RM,
  calculateExerciseMetrics,
  calculateWorkoutMetrics,
  detectPersonalBests,
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
    // both working sets tie at volume 500 -> first set (index 1) wins
    expect(m.bestSetVolume).toBe(500);
    expect(m.bestSetVolumeSetIndex).toBe(1);
    expect(m.heaviestWeightSetIndex).toBe(1);
    expect(m.bestEstimated1RMSetIndex).toBe(1);
  });

  it('tracks the winning set index per axis, keeping the first set on ties', () => {
    const exercise = {
      sets: [
        set({ type: 'warmup', weight: 40, reps: 10 }),
        set({ weight: 100, reps: 5 }), // index 1: volume 500, 1RM 116.7
        set({ weight: 120, reps: 3 }), // index 2: heaviest weight, volume 360, 1RM 132
      ],
    };

    const m = calculateExerciseMetrics(exercise);

    expect(m.heaviestWeight).toBe(120);
    expect(m.heaviestWeightSetIndex).toBe(2);
    expect(m.bestEstimated1RM).toBe(132);
    expect(m.bestEstimated1RMSetIndex).toBe(2);
    expect(m.bestSetVolume).toBe(500);
    expect(m.bestSetVolumeSetIndex).toBe(1);
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
    expect(m.bestSetVolume).toBeNull();
    expect(m.heaviestWeightSetIndex).toBeNull();
    expect(m.bestEstimated1RMSetIndex).toBeNull();
    expect(m.bestSetVolumeSetIndex).toBeNull();
  });

  it('classifies a reps-only exercise as bodyweight', () => {
    const exercise = { sets: [set({ reps: 10 })] };

    const m = calculateExerciseMetrics(exercise);

    expect(m.exerciseType).toBe('bodyweight');
    expect(m.sessionVolume).toBe(0);
    expect(m.heaviestWeight).toBeNull();
    expect(m.bestSetVolume).toBeNull();
    expect(m.heaviestWeightSetIndex).toBeNull();
    expect(m.bestEstimated1RMSetIndex).toBeNull();
    expect(m.bestSetVolumeSetIndex).toBeNull();
  });

  it('never returns a raw -1 sentinel set index even when weight is logged with no reps (regression: this crashed backfillPersonalBests.js on a real production row)', () => {
    // weight_kg present (so hasWeightData=true) but reps null -> volume stays 0 for every set,
    // so the *SetIndex trackers never get assigned a real index during the scan.
    const exercise = { sets: [set({ weight: 20 })] };

    const m = calculateExerciseMetrics(exercise);

    expect(m.heaviestWeight).toBe(0);
    expect(m.heaviestWeightSetIndex).toBeNull();
    expect(m.bestEstimated1RMSetIndex).toBeNull();
    expect(m.bestSetVolumeSetIndex).toBeNull();
  });
});

describe('detectPersonalBests', () => {
  it('flags every non-null axis as a PR when priorBest is null/undefined', () => {
    const sessionMetrics = {
      heaviestWeight: 100,
      heaviestWeightSetIndex: 1,
      bestEstimated1RM: 116.7,
      bestEstimated1RMSetIndex: 1,
      bestSetVolume: 500,
      bestSetVolumeSetIndex: 1,
    };

    expect(detectPersonalBests(sessionMetrics, null)).toEqual({
      weightPRSetIndex: 1,
      oneRepMaxPRSetIndex: 1,
      volumePRSetIndex: 1,
    });
    expect(detectPersonalBests(sessionMetrics, undefined)).toEqual({
      weightPRSetIndex: 1,
      oneRepMaxPRSetIndex: 1,
      volumePRSetIndex: 1,
    });
  });

  it('flags all three axes when the session beats prior on all of them', () => {
    const sessionMetrics = {
      heaviestWeight: 120,
      heaviestWeightSetIndex: 2,
      bestEstimated1RM: 140,
      bestEstimated1RMSetIndex: 2,
      bestSetVolume: 600,
      bestSetVolumeSetIndex: 2,
    };
    const priorBest = { heaviestWeight: 100, bestEstimated1RM: 116.7, bestSetVolume: 500 };

    expect(detectPersonalBests(sessionMetrics, priorBest)).toEqual({
      weightPRSetIndex: 2,
      oneRepMaxPRSetIndex: 2,
      volumePRSetIndex: 2,
    });
  });

  it('flags only the axis that improved (new heaviest weight at lower reps)', () => {
    // Heavier weight but fewer reps -> lower estimated 1RM and lower set volume than prior
    const sessionMetrics = {
      heaviestWeight: 130,
      heaviestWeightSetIndex: 0,
      bestEstimated1RM: 130, // 130 * (1 + 1/30) rounded, still below prior 1RM below
      bestEstimated1RMSetIndex: 0,
      bestSetVolume: 130,
      bestSetVolumeSetIndex: 0,
    };
    const priorBest = { heaviestWeight: 120, bestEstimated1RM: 140, bestSetVolume: 600 };

    expect(detectPersonalBests(sessionMetrics, priorBest)).toEqual({
      weightPRSetIndex: 0,
      oneRepMaxPRSetIndex: null,
      volumePRSetIndex: null,
    });
  });

  it('does not flag an axis when the session only ties the prior record', () => {
    const sessionMetrics = {
      heaviestWeight: 100,
      heaviestWeightSetIndex: 1,
      bestEstimated1RM: 116.7,
      bestEstimated1RMSetIndex: 1,
      bestSetVolume: 500,
      bestSetVolumeSetIndex: 1,
    };
    const priorBest = { heaviestWeight: 100, bestEstimated1RM: 116.7, bestSetVolume: 500 };

    expect(detectPersonalBests(sessionMetrics, priorBest)).toEqual({
      weightPRSetIndex: null,
      oneRepMaxPRSetIndex: null,
      volumePRSetIndex: null,
    });
  });

  it('never flags an axis with a null session value, regardless of priorBest', () => {
    const sessionMetrics = {
      heaviestWeight: null,
      heaviestWeightSetIndex: -1,
      bestEstimated1RM: null,
      bestEstimated1RMSetIndex: -1,
      bestSetVolume: null,
      bestSetVolumeSetIndex: -1,
    };

    expect(detectPersonalBests(sessionMetrics, null)).toEqual({
      weightPRSetIndex: null,
      oneRepMaxPRSetIndex: null,
      volumePRSetIndex: null,
    });
    expect(detectPersonalBests(sessionMetrics, { heaviestWeight: null, bestEstimated1RM: null, bestSetVolume: null })).toEqual({
      weightPRSetIndex: null,
      oneRepMaxPRSetIndex: null,
      volumePRSetIndex: null,
    });
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
