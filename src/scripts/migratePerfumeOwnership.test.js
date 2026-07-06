const { deriveOwnership } = require('./migratePerfumeOwnership');

describe('deriveOwnership', () => {
  it('returns "Full bottle" when considerFullBottle is truthy, regardless of considerTravelSize', () => {
    expect(deriveOwnership({ considerFullBottle: true, considerTravelSize: true })).toBe('Full bottle');
    expect(deriveOwnership({ considerFullBottle: true, considerTravelSize: false })).toBe('Full bottle');
  });

  it('returns "Travel size" when considerTravelSize is truthy and considerFullBottle is falsy', () => {
    expect(deriveOwnership({ considerTravelSize: true, considerFullBottle: false })).toBe('Travel size');
  });

  it('returns "Sample" when neither flag is set', () => {
    expect(deriveOwnership({ considerTravelSize: false, considerFullBottle: false })).toBe('Sample');
    expect(deriveOwnership({})).toBe('Sample');
  });
});
