import { validatePerfumeRating, perfumeId } from './perfumes';

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
