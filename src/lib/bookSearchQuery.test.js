import { stripSeriesPrefix } from './bookSearchQuery';

describe('stripSeriesPrefix', () => {
  it('strips a "<Series> <Number>: " prefix, keeping only the subtitle', () => {
    expect(stripSeriesPrefix('The Horus Heresy 41: The Master of Mankind')).toBe('The Master of Mankind');
    expect(stripSeriesPrefix('The Horus Heresy 1: Horus Rising')).toBe('Horus Rising');
  });

  it('leaves a title with no series-number prefix unchanged', () => {
    expect(stripSeriesPrefix('The Bitcoin Standard')).toBe('The Bitcoin Standard');
    expect(stripSeriesPrefix('Project Hail Mary')).toBe('Project Hail Mary');
  });

  it('leaves a title containing a colon but no series-number prefix unchanged', () => {
    expect(stripSeriesPrefix('Sapiens: A Brief History of Humankind')).toBe('Sapiens: A Brief History of Humankind');
  });
});
