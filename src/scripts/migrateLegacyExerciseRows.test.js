import { isLegacyShape } from './migrateLegacyExerciseRows';

describe('isLegacyShape', () => {
  it('flags a row missing exercise_name', () => {
    expect(isLegacyShape({ workout_date: '2026-03-13', title: 'Iso-Lateral High Row (Machine)' })).toBe(true);
  });

  it('flags a row missing workout_date', () => {
    expect(isLegacyShape({ exercise_name: 'Iso-Lateral High Row (Machine)' })).toBe(true);
  });

  it('flags a row missing both', () => {
    expect(isLegacyShape({ title: 'Iso-Lateral High Row (Machine)', workout_start_time: '2026-03-13T10:00:00+00:00' })).toBe(true);
  });

  it('does not flag a row with both exercise_name and workout_date present', () => {
    expect(isLegacyShape({ exercise_name: 'Iso-Lateral High Row (Machine)', workout_date: '2026-03-13' })).toBe(false);
  });
});
