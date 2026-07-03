import { applicationSpotCounts, countsToApplicationSpots } from './PerfumeCharacteristics';

describe('applicationSpotCounts', () => {
  it('defaults every spot to 0 when applicationSpots is empty', () => {
    expect(applicationSpotCounts([])).toEqual({
      Wrists: 0,
      Elbows: 0,
      Clavicles: 0,
      Beard: 0,
      'Back of neck': 0,
      'Behind ears': 0,
      Clothes: 0,
    });
  });

  it('defaults every spot to 0 when applicationSpots is undefined (pre-T094 reviews)', () => {
    expect(applicationSpotCounts(undefined)).toEqual({
      Wrists: 0,
      Elbows: 0,
      Clavicles: 0,
      Beard: 0,
      'Back of neck': 0,
      'Behind ears': 0,
      Clothes: 0,
    });
  });

  it('maps known spots to their spray count', () => {
    const counts = applicationSpotCounts([
      { spot: 'Wrists', sprays: 2 },
      { spot: 'Behind ears', sprays: 1 },
    ]);

    expect(counts.Wrists).toBe(2);
    expect(counts['Behind ears']).toBe(1);
    expect(counts.Elbows).toBe(0);
  });
});

describe('countsToApplicationSpots', () => {
  it('omits spots with a zero count', () => {
    const result = countsToApplicationSpots({
      Wrists: 2,
      Elbows: 0,
      Clavicles: 0,
      Beard: 0,
      'Back of neck': 0,
      'Behind ears': 1,
    });

    expect(result).toEqual([
      { spot: 'Wrists', sprays: 2 },
      { spot: 'Behind ears', sprays: 1 },
    ]);
  });

  it('returns an empty array when every spot is 0', () => {
    const result = countsToApplicationSpots({
      Wrists: 0,
      Elbows: 0,
      Clavicles: 0,
      Beard: 0,
      'Back of neck': 0,
      'Behind ears': 0,
      Clothes: 0,
    });

    expect(result).toEqual([]);
  });
});
