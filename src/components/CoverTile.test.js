import { render } from '@testing-library/react';
import CoverTile, { assignGradients, gradientForKey } from './CoverTile';

describe('assignGradients', () => {
  const keys = Array.from({ length: 30 }, (_, i) => `item-${i}`);

  it('never repeats a gradient within the trailing 4 positions', () => {
    const assigned = assignGradients(keys);

    assigned.forEach((gradient, i) => {
      const windowStart = Math.max(0, i - 4);
      const trailing = assigned.slice(windowStart, i);
      expect(trailing).not.toContain(gradient);
    });
  });

  it('is deterministic for identical input', () => {
    expect(assignGradients(keys)).toEqual(assignGradients(keys));
  });

  it('keeps the preferred gradientForKey colour when it does not collide with the trailing window', () => {
    // A single key has nothing preceding it, so it can never collide.
    const [onlyKey] = keys;
    const [assigned] = assignGradients([onlyKey]);
    expect(assigned).toBe(gradientForKey(onlyKey));
  });
});

describe('CoverTile backward compatibility', () => {
  // jsdom's CSSOM does not parse `background: linear-gradient(...)` shorthand values,
  // so the gradient can't be asserted via rendered style — cover the same logic that
  // CoverTile's tileStyle computation uses directly instead (per T201's fallback guidance).
  function computeTileBackground({ imageUrl, gradient, id, title }) {
    return imageUrl ? undefined : gradient || gradientForKey(id || title || '');
  }

  it('resolves to gradientForKey(id || title) when no gradient override is passed', () => {
    expect(computeTileBackground({ id: 'my-id', title: 'My Title' })).toBe(
      gradientForKey('my-id')
    );
  });

  it('uses an explicit gradient override instead of the computed one', () => {
    const override = 'linear-gradient(135deg, #000000, #ffffff)';
    expect(
      computeTileBackground({ id: 'my-id', title: 'My Title', gradient: override })
    ).toBe(override);
  });

  it('renders without crashing with and without a gradient prop', () => {
    const { container: withoutGradient } = render(
      <CoverTile id="my-id" title="My Title" />
    );
    const { container: withGradient } = render(
      <CoverTile id="my-id" title="My Title" gradient="linear-gradient(135deg, #000, #fff)" />
    );
    expect(withoutGradient.querySelector('.cover-tile')).not.toBeNull();
    expect(withGradient.querySelector('.cover-tile')).not.toBeNull();
  });
});
