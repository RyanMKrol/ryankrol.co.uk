import { getExercisePreview } from '../../../src/pages/workouts/index';

describe('getExercisePreview', () => {
  it('returns no shown exercises and no remaining for an empty exercise list', () => {
    expect(getExercisePreview([])).toEqual({ shown: [], remaining: 0 });
  });

  it('returns all exercises with zero remaining when under the max', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({
      shown: [
        { name: 'Bench Press', prAxes: [] },
        { name: 'Squat', prAxes: [] },
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
        { name: 'Bench Press', prAxes: [] },
        { name: 'Squat', prAxes: [] },
        { name: 'Deadlift', prAxes: [] },
      ],
      remaining: 2,
    });
  });

  it('respects a custom maxShown value', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }, { title: 'Deadlift' }];
    expect(getExercisePreview(exercises, 1)).toEqual({
      shown: [{ name: 'Bench Press', prAxes: [] }],
      remaining: 2,
    });
  });

  it('filters out exercises without a title', () => {
    const exercises = [{ title: 'Bench Press' }, {}, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({
      shown: [
        { name: 'Bench Press', prAxes: [] },
        { name: 'Squat', prAxes: [] },
      ],
      remaining: 0,
    });
  });

  it('names each PR axis that any set carries, per exercise', () => {
    const exercises = [
      { title: 'Bench Press', sets: [{ isWeightPR: true }, {}] },
      { title: 'Squat', sets: [{ is1RMPR: true }] },
      { title: 'Deadlift', sets: [{ isVolumePR: true }] },
      { title: 'Row', sets: [{}] },
    ];

    const { shown } = getExercisePreview(exercises, 4);

    expect(shown).toEqual([
      { name: 'Bench Press', prAxes: [{ key: 'weight', label: 'Weight', ariaLabel: 'weight personal best' }] },
      { name: 'Squat', prAxes: [{ key: '1rm', label: '1RM', ariaLabel: '1RM personal best' }] },
      { name: 'Deadlift', prAxes: [{ key: 'volume', label: 'Volume', ariaLabel: 'volume personal best' }] },
      { name: 'Row', prAxes: [] },
    ]);
  });

  it('dedupes and combines multiple PR axes across different sets of one exercise', () => {
    const exercises = [
      {
        title: 'Squat',
        sets: [
          { isWeightPR: true },
          { is1RMPR: true, isVolumePR: true },
        ],
      },
    ];

    const { shown } = getExercisePreview(exercises);

    expect(shown).toEqual([
      {
        name: 'Squat',
        prAxes: [
          { key: 'weight', label: 'Weight', ariaLabel: 'weight personal best' },
          { key: '1rm', label: '1RM', ariaLabel: '1RM personal best' },
          { key: 'volume', label: 'Volume', ariaLabel: 'volume personal best' },
        ],
      },
    ]);
  });

  it('treats a missing sets array as no personal best', () => {
    const { shown } = getExercisePreview([{ title: 'Curl' }]);
    expect(shown).toEqual([{ name: 'Curl', prAxes: [] }]);
  });
});
