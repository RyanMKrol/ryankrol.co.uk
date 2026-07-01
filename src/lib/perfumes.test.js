import {
  validatePerfumeRating,
  validateLongevity,
  validateProjection,
  validateSeasons,
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
