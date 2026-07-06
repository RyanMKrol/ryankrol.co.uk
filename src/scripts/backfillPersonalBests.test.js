import { groupByExerciseNameChronological, computePersonalBestUpdates, applyFlagsToSets } from './backfillPersonalBests.js';

function makeRow({ exercise_name, workout_date, exercise_id, weight, reps }) {
  return {
    exercise_id,
    exercise_name,
    workout_date,
    exercise_index: 0,
    workout_id: `${exercise_id}-workout`,
    sets: [{ type: 'normal', weight_kg: weight, reps }],
  };
}

describe('groupByExerciseNameChronological', () => {
  it('groups rows by exercise_name and sorts each group oldest-first, interleaved input', () => {
    const rows = [
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-03-01', exercise_id: 'b3', weight: 80, reps: 5 }),
      makeRow({ exercise_name: 'Squat', workout_date: '2026-02-01', exercise_id: 's1', weight: 100, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-01-01', exercise_id: 'b1', weight: 70, reps: 5 }),
      makeRow({ exercise_name: 'Squat', workout_date: '2026-03-01', exercise_id: 's2', weight: 110, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-02-01', exercise_id: 'b2', weight: 75, reps: 5 }),
    ];

    const grouped = groupByExerciseNameChronological(rows);

    expect(grouped.get('Bench Press').map(r => r.exercise_id)).toEqual(['b1', 'b2', 'b3']);
    expect(grouped.get('Squat').map(r => r.exercise_id)).toEqual(['s1', 's2']);
  });
});

describe('computePersonalBestUpdates', () => {
  it('carries the running best forward across a chronological sequence per exercise', () => {
    const rows = [
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-03-01', exercise_id: 'b3', weight: 80, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-01-01', exercise_id: 'b1', weight: 70, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-02-01', exercise_id: 'b2', weight: 75, reps: 5 }),
    ];

    const updates = computePersonalBestUpdates(rows);

    // Every row is chronologically higher than the last, so all three are PRs.
    expect(updates.map(u => u.row.exercise_id)).toEqual(['b1', 'b2', 'b3']);
    updates.forEach(u => expect(u.weightPRSetIndex).toBe(0));
  });

  it('does not flag a row that is lower than an earlier session, and does not let a later dip erase the running best', () => {
    const rows = [
      makeRow({ exercise_name: 'Deadlift', workout_date: '2026-01-01', exercise_id: 'd1', weight: 150, reps: 3 }),
      makeRow({ exercise_name: 'Deadlift', workout_date: '2026-02-01', exercise_id: 'd2', weight: 120, reps: 3 }),
      makeRow({ exercise_name: 'Deadlift', workout_date: '2026-03-01', exercise_id: 'd3', weight: 160, reps: 3 }),
    ];

    const updates = computePersonalBestUpdates(rows);

    const updatedIds = updates.map(u => u.row.exercise_id);
    expect(updatedIds).toContain('d1');
    expect(updatedIds).not.toContain('d2');
    expect(updatedIds).toContain('d3');
  });

  it('processes multiple exercises independently, interleaved out-of-order in the input', () => {
    const rows = [
      makeRow({ exercise_name: 'Squat', workout_date: '2026-02-01', exercise_id: 's2', weight: 90, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-02-01', exercise_id: 'b2', weight: 60, reps: 5 }),
      makeRow({ exercise_name: 'Squat', workout_date: '2026-01-01', exercise_id: 's1', weight: 100, reps: 5 }),
      makeRow({ exercise_name: 'Bench Press', workout_date: '2026-01-01', exercise_id: 'b1', weight: 50, reps: 5 }),
    ];

    const updates = computePersonalBestUpdates(rows);
    const updatedIds = updates.map(u => u.row.exercise_id).sort();

    // s1 (100kg first ever) and b1/b2 (each higher than the last) are PRs; s2 (90 < 100) is not.
    expect(updatedIds).toEqual(['b1', 'b2', 's1']);
  });

  it('never produces a -1 set index and never crashes applyFlagsToSets, even for a row with weight logged but no reps (regression: this crashed a real production run)', () => {
    const rows = [
      // weight_kg present but reps null -> volume stays 0 for every set on this row, so
      // calculateExerciseMetrics's *SetIndex trackers never get assigned a real index.
      makeRow({ exercise_name: 'Cable Twist', workout_date: '2026-02-09', exercise_id: 'c1', weight: 20, reps: null }),
    ];

    const updates = computePersonalBestUpdates(rows);

    updates.forEach((u) => {
      expect(u.weightPRSetIndex).not.toBe(-1);
      expect(u.oneRepMaxPRSetIndex).not.toBe(-1);
      expect(u.volumePRSetIndex).not.toBe(-1);
      // Must not throw — this is the exact call that crashed in production.
      expect(() => applyFlagsToSets(u.row.sets, u)).not.toThrow();
    });
  });
});

describe('applyFlagsToSets', () => {
  it('sets the flag(s) only on the specific set index the update names, without mutating the original array', () => {
    const sets = [
      { type: 'warmup', weight_kg: 40, reps: 8 },
      { type: 'normal', weight_kg: 100, reps: 5 },
    ];

    const flagged = applyFlagsToSets(sets, {
      weightPRSetIndex: 1,
      oneRepMaxPRSetIndex: 1,
      volumePRSetIndex: null,
    });

    expect(flagged[1].isWeightPR).toBe(true);
    expect(flagged[1].is1RMPR).toBe(true);
    expect(flagged[1].isVolumePR).toBeUndefined();
    expect(flagged[0].isWeightPR).toBeUndefined();
    expect(sets[1].isWeightPR).toBeUndefined();
  });
});
