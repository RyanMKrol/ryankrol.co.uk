export const DEFAULTS = {
  theme: 'cyberpunk',
  mode: 'system',
  font: 'share-tech-mono',
  motion: 'full',
};

export const STORAGE_KEYS = {
  theme: 'appearance-theme',
  mode: 'appearance-mode',
  font: 'appearance-font',
  motion: 'appearance-motion',
};

const VALID_MODES = ['light', 'dark', 'system'];
const VALID_MOTIONS = ['full', 'reduced'];

// Pure: maps stored mode + OS pref to a concrete 'light' | 'dark' value.
// 'system' (or any invalid/empty value) defers to osPrefersDark.
export function resolveMode(storedMode, osPrefersDark) {
  if (storedMode === 'light') return 'light';
  if (storedMode === 'dark') return 'dark';
  return osPrefersDark ? 'dark' : 'light';
}

// Pure: applies defaults to a raw storage object (all values may be null/invalid).
export function applyDefaults(raw, osPrefersDark, osReducedMotion) {
  const theme = raw.theme || DEFAULTS.theme;
  const mode = VALID_MODES.includes(raw.mode) ? raw.mode : DEFAULTS.mode;
  const font = raw.font || DEFAULTS.font;
  const motion = VALID_MOTIONS.includes(raw.motion)
    ? raw.motion
    : osReducedMotion ? 'reduced' : DEFAULTS.motion;
  const resolvedMode = resolveMode(mode, osPrefersDark);
  return { theme, mode, font, motion, resolvedMode };
}

// Browser-only: reads localStorage + media queries and returns the full appearance object.
export function readStoredAppearance() {
  try {
    const raw = {
      theme: localStorage.getItem(STORAGE_KEYS.theme),
      mode: localStorage.getItem(STORAGE_KEYS.mode),
      font: localStorage.getItem(STORAGE_KEYS.font),
      motion: localStorage.getItem(STORAGE_KEYS.motion),
    };
    const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const osReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return applyDefaults(raw, osPrefersDark, osReducedMotion);
  } catch {
    return { ...DEFAULTS, resolvedMode: DEFAULTS.mode === 'system' ? 'dark' : DEFAULTS.mode };
  }
}
