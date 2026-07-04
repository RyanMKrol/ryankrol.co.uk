const { missingExerciseIndexes } = require('./backfillMissingExerciseRows');

describe('missingExerciseIndexes', () => {
  it('returns an empty array when no rows are missing', () => {
    const existingRows = [{ exercise_index: 0 }, { exercise_index: 1 }];
    expect(missingExerciseIndexes(2, existingRows)).toEqual([]);
  });

  it('returns only the indexes with no matching row when some rows are missing', () => {
    const existingRows = [{ exercise_index: 0 }, { exercise_index: 2 }];
    expect(missingExerciseIndexes(3, existingRows)).toEqual([1]);
  });

  it('returns every index when all rows are missing', () => {
    expect(missingExerciseIndexes(3, [])).toEqual([0, 1, 2]);
  });

  it('returns an empty array for a workout with zero exercises', () => {
    expect(missingExerciseIndexes(0, [])).toEqual([]);
  });

  it('falls back to the older `index` field when `exercise_index` is absent', () => {
    const existingRows = [{ index: 0 }];
    expect(missingExerciseIndexes(2, existingRows)).toEqual([1]);
  });
});
