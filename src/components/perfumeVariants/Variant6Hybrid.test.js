import { formatApplicationSpotLine } from './Variant6Hybrid';

describe('formatApplicationSpotLine', () => {
  it.each([
    ['Wrists', '1 spray each — Wrists'],
    ['Elbows', '1 spray each — Elbows'],
    ['Clavicles', '1 spray each — Clavicles'],
    ['Behind ears', '1 spray each — Behind ears'],
    ['Beard', '1 spray — Beard'],
    ['Back of neck', '1 spray — Back of neck'],
    ['Clothes', '1 spray — Clothes'],
  ])('at sprays === 1, %s renders "%s"', (spot, expected) => {
    expect(formatApplicationSpotLine({ spot, sprays: 1 })).toBe(expected);
  });

  it('renders plural sprays unchanged with no "each" appended', () => {
    expect(formatApplicationSpotLine({ spot: 'Wrists', sprays: 2 })).toBe(
      '2 sprays — Wrists',
    );
  });
});
