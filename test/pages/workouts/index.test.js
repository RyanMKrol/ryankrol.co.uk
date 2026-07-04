import { getExercisePreview } from '../../../src/pages/workouts/index';

describe('getExercisePreview', () => {
  it('returns no shown names and no remaining for an empty exercise list', () => {
    expect(getExercisePreview([])).toEqual({ shown: [], remaining: 0 });
  });

  it('returns all names with zero remaining when under the max', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({ shown: ['Bench Press', 'Squat'], remaining: 0 });
  });

  it('caps shown names at maxShown and reports the remaining count', () => {
    const exercises = [
      { title: 'Bench Press' },
      { title: 'Squat' },
      { title: 'Deadlift' },
      { title: 'Overhead Press' },
      { title: 'Row' },
    ];
    expect(getExercisePreview(exercises)).toEqual({
      shown: ['Bench Press', 'Squat', 'Deadlift'],
      remaining: 2,
    });
  });

  it('respects a custom maxShown value', () => {
    const exercises = [{ title: 'Bench Press' }, { title: 'Squat' }, { title: 'Deadlift' }];
    expect(getExercisePreview(exercises, 1)).toEqual({ shown: ['Bench Press'], remaining: 2 });
  });

  it('filters out exercises without a title', () => {
    const exercises = [{ title: 'Bench Press' }, {}, { title: 'Squat' }];
    expect(getExercisePreview(exercises)).toEqual({ shown: ['Bench Press', 'Squat'], remaining: 0 });
  });
});
