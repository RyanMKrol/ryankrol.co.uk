import { formatVolumeKg } from '../pages/workouts/index';

describe('formatVolumeKg', () => {
  it('returns the exact integer kg value unchanged', () => {
    expect(formatVolumeKg(8600)).toBe('8600');
  });

  it('rounds down a fractional kg value below the half', () => {
    expect(formatVolumeKg(8600.4)).toBe('8600');
  });

  it('rounds up a fractional kg value at or above the half', () => {
    expect(formatVolumeKg(8600.6)).toBe('8601');
  });
});
