import { resolveMode, applyDefaults, DEFAULTS, STORAGE_KEYS } from './appearance';

describe('resolveMode', () => {
  test('returns dark when storedMode is dark, regardless of OS pref', () => {
    expect(resolveMode('dark', false)).toBe('dark');
    expect(resolveMode('dark', true)).toBe('dark');
  });

  test('returns light when storedMode is light, regardless of OS pref', () => {
    expect(resolveMode('light', false)).toBe('light');
    expect(resolveMode('light', true)).toBe('light');
  });

  test('returns dark when storedMode is system and OS prefers dark', () => {
    expect(resolveMode('system', true)).toBe('dark');
  });

  test('returns light when storedMode is system and OS does not prefer dark', () => {
    expect(resolveMode('system', false)).toBe('light');
  });

  test('treats null as system (falls back to OS pref)', () => {
    expect(resolveMode(null, true)).toBe('dark');
    expect(resolveMode(null, false)).toBe('light');
  });

  test('treats empty string as system (falls back to OS pref)', () => {
    expect(resolveMode('', true)).toBe('dark');
    expect(resolveMode('', false)).toBe('light');
  });

  test('treats garbage value as system (falls back to OS pref)', () => {
    expect(resolveMode('banana', true)).toBe('dark');
    expect(resolveMode('banana', false)).toBe('light');
  });
});

describe('applyDefaults', () => {
  test('uses stored values when all are valid', () => {
    const result = applyDefaults(
      { theme: 'matrix', mode: 'light', font: 'courier', motion: 'reduced' },
      true,
      false
    );
    expect(result.theme).toBe('matrix');
    expect(result.mode).toBe('light');
    expect(result.font).toBe('courier');
    expect(result.motion).toBe('reduced');
    expect(result.resolvedMode).toBe('light');
  });

  test('falls back to defaults when raw values are null', () => {
    const result = applyDefaults({ theme: null, mode: null, font: null, motion: null }, false, false);
    expect(result.theme).toBe(DEFAULTS.theme);
    expect(result.mode).toBe(DEFAULTS.mode);
    expect(result.font).toBe(DEFAULTS.font);
    expect(result.motion).toBe(DEFAULTS.motion);
  });

  test('falls back to defaults when raw values are empty strings', () => {
    const result = applyDefaults({ theme: '', mode: '', font: '', motion: '' }, false, false);
    expect(result.theme).toBe(DEFAULTS.theme);
    expect(result.font).toBe(DEFAULTS.font);
  });

  test('resolvedMode follows OS pref when mode is system', () => {
    const dark = applyDefaults({ theme: null, mode: 'system', font: null, motion: null }, true, false);
    expect(dark.resolvedMode).toBe('dark');

    const light = applyDefaults({ theme: null, mode: 'system', font: null, motion: null }, false, false);
    expect(light.resolvedMode).toBe('light');
  });

  test('motion defaults to reduced when OS prefers reduced motion and nothing stored', () => {
    const result = applyDefaults({ theme: null, mode: null, font: null, motion: null }, false, true);
    expect(result.motion).toBe('reduced');
  });

  test('explicit stored motion=full overrides OS reduced-motion preference', () => {
    const result = applyDefaults({ theme: null, mode: null, font: null, motion: 'full' }, false, true);
    expect(result.motion).toBe('full');
  });

  test('invalid mode value falls back to default mode', () => {
    const result = applyDefaults({ theme: null, mode: 'banana', font: null, motion: null }, true, false);
    expect(result.mode).toBe(DEFAULTS.mode);
  });
});
