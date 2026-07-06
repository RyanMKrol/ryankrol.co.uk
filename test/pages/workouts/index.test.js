import { getExercisePreview } from '../../../src/pages/workouts/index';

describe('getExercisePreview', () => {
  it('returns no shown exercises and no remaining for an empty exercise list', () => {
    expect(getExercisePreview([])).toEqual({ shown: [], remaining: 0 });
  });

  it('returns all exercises with zero remaining when under the max', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({
      shown: [
        { name: 'Bench Press', hasPersonalBest: false },
        { name: 'Squat', hasPersonalBest: false },
      ],
      remaining: 0,
    });
  });

  it('caps shown exercises at maxShown and reports the remaining count', () => {
    const exercises = [
      { title: 'Bench Press' },
      { title: 'Squat' },
      { title: 'Deadlift' },
      { title: 'Overhead Press' },
      { title: 'Row' },
    ];
    expect(getExercisePreview(exercises)).toEqual({
      shown: [
        { name: 'Bench Press', hasPersonalBest: false },
        { name: 'Squat', hasPersonalBest: false },
        { name: 'Deadlift', hasPersonalBest: false },
      ],
      remaining: 2,
    });
  });

  it('respects a custom maxShown value', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }, { title: 'Deadlift' }];
    expect(getExercisePreview(exercises, 1)).toEqual({
      shown: [{ name: 'Bench Press', hasPersonalBest: false }],
      remaining: 2,
    });
  });

  it('filters out exercises without a title', () => {
    const exercises = [{ title: 'Bench Press' }, {}, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({
      shown: [
        { name: 'Bench Press', hasPersonalBest: false },
        { name: 'Squat', hasPersonalBest: false },
      ],
      remaining: 0,
    });
  });

  it('marks an exercise as a personal best when any set carries a PR flag', () => {
    const exercises = [
      { title: 'Bench Press', sets: [{ isWeightPR: true }, {}] },
      { title: 'Squat', sets: [{ is1RMPR: true }] },
      { title: 'Deadlift', sets: [{ isVolumePR: true }] },
      { title: 'Row', sets: [{}] },
    ];

    const { shown } = getExercisePreview(exercises, 4);

    expect(shown).toEqual([
      { name: 'Bench Press', hasPersonalBest: true },
      { name: 'Squat', hasPersonalBest: true },
      { name: 'Deadlift', hasPersonalBest: true },
      { name: 'Row', hasPersonalBest: false },
    ]);
  });

  it('treats a missing sets array as no personal best', () => {
    const { shown } = getExercisePreview([{ title: 'Curl' }]);
    expect(shown).toEqual([{ name: 'Curl', hasPersonalBest: false }]);
  });
});
