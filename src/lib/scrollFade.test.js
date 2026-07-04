import { shouldShowScrollFade } from './scrollFade';

describe('shouldShowScrollFade', () => {
  it('returns false when there is no overflow', () => {
    expect(
      shouldShowScrollFade({ scrollWidth: 500, clientWidth: 500, scrollLeft: 0 })
    ).toBe(false);
  });

  it('returns true when overflowing at the very start', () => {
    expect(
      shouldShowScrollFade({ scrollWidth: 800, clientWidth: 500, scrollLeft: 0 })
    ).toBe(true);
  });

  it('returns true when overflowing and mid-scroll', () => {
    expect(
      shouldShowScrollFade({ scrollWidth: 800, clientWidth: 500, scrollLeft: 150 })
    ).toBe(true);
  });

  it('returns false when scrolled exactly to the max', () => {
    expect(
      shouldShowScrollFade({ scrollWidth: 800, clientWidth: 500, scrollLeft: 300 })
    ).toBe(false);
  });

  it('returns false when within epsilon of the max (sub-pixel jitter)', () => {
    expect(
      shouldShowScrollFade({ scrollWidth: 800, clientWidth: 500, scrollLeft: 299.5 })
    ).toBe(false);
  });
});
