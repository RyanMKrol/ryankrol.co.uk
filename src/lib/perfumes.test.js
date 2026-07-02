import {
  validatePerfumeRating,
  validateLongevity,
  validateProjection,
  validateSeasons,
  validateApplicationSpots,
  validateFragranticaUrl,
  perfumeId,
} from './perfumes';

describe('validatePerfumeRating', () => {
  test.each([0, 5, 10])('accepts integer %i', (value) => {
    expect(validatePerfumeRating(value)).toBe(true);
  });

  test.each([6.5, -1, 11, 'x', undefined, null])('rejects %p', (value) => {
    expect(validatePerfumeRating(value)).toBe(false);
  });
});

describe('perfumeId', () => {
  test('is stable for the same input', () => {
    const perfume = { title: 'Ombré Leather', designer: 'Tom Ford', type: 'EDP' };
    expect(perfumeId(perfume)).toBe(perfumeId({ ...perfume }));
  });

  test('differs for the same title with a different type', () => {
    const edp = perfumeId({ title: 'Ombré Leather', designer: 'Tom Ford', type: 'EDP' });
    const parfum = perfumeId({ title: 'Ombré Leather', designer: 'Tom Ford', type: 'Parfum' });
    expect(edp).not.toBe(parfum);
  });
});

describe('validateLongevity', () => {
  test.each([0, 8])('accepts boundary value %i', (value) => {
    expect(validateLongevity(value)).toBe(true);
  });

  test.each([-1, 9])('rejects out-of-range value %i', (value) => {
    expect(validateLongevity(value)).toBe(false);
  });
});

describe('validateProjection', () => {
  test.each([1, 4])('accepts boundary value %i', (value) => {
    expect(validateProjection(value)).toBe(true);
  });

  test.each([0, 5])('rejects out-of-range value %i', (value) => {
    expect(validateProjection(value)).toBe(false);
  });
});

describe('validateSeasons', () => {
  test('accepts an empty array and a valid list of seasons', () => {
    expect(validateSeasons([])).toBe(true);
    expect(validateSeasons(['Winter', 'Night'])).toBe(true);
  });

  test('rejects an invalid season entry or a non-array', () => {
    expect(validateSeasons(['Winter', 'NotASeason'])).toBe(false);
    expect(validateSeasons('Winter')).toBe(false);
  });
});

describe('validateApplicationSpots', () => {
  test('accepts an empty array and a valid list of {spot, sprays} objects', () => {
    expect(validateApplicationSpots([])).toBe(true);
    expect(
      validateApplicationSpots([
        { spot: 'Wrists', sprays: 2 },
        { spot: 'Behind ears', sprays: 1 },
      ]),
    ).toBe(true);
  });

  test('rejects an unrecognised spot, a non-array, or the old flat-string shape', () => {
    expect(validateApplicationSpots([{ spot: 'NotASpot', sprays: 1 }])).toBe(false);
    expect(validateApplicationSpots('Wrists')).toBe(false);
    expect(validateApplicationSpots(['Wrists'])).toBe(false);
  });

  test('rejects a sprays value of zero or negative', () => {
    expect(validateApplicationSpots([{ spot: 'Wrists', sprays: 0 }])).toBe(false);
    expect(validateApplicationSpots([{ spot: 'Wrists', sprays: -1 }])).toBe(false);
  });
});

describe('validateFragranticaUrl', () => {
  test('accepts well-formed http/https URLs', () => {
    expect(validateFragranticaUrl('https://www.fragrantica.com/perfume/Some/Perfume-123.html')).toBe(true);
    expect(validateFragranticaUrl('http://example.com')).toBe(true);
  });

  test('rejects missing, non-string, or malformed values', () => {
    expect(validateFragranticaUrl(undefined)).toBe(false);
    expect(validateFragranticaUrl('')).toBe(false);
    expect(validateFragranticaUrl('not a url')).toBe(false);
    expect(validateFragranticaUrl('ftp://example.com')).toBe(false);
  });
});
