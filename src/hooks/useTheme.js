import { useState, useEffect } from 'react';
import { readStoredAppearance, resolveMode, STORAGE_KEYS, DEFAULTS } from '../lib/appearance';

const SSR_STATE = { ...DEFAULTS, resolvedMode: 'dark' };

export default function useTheme() {
  const [appearance, setAppearance] = useState(SSR_STATE);

  useEffect(() => {
    const stored = readStoredAppearance();
    setAppearance(stored);

    // React to OS dark-mode changes when stored mode is 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleOsChange() {
      const current = readStoredAppearance();
      if (current.mode === 'system') {
        const resolved = mq.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-mode', resolved);
        setAppearance(prev => ({ ...prev, resolvedMode: resolved }));
      }
    }
    mq.addEventListener('change', handleOsChange);
    return () => mq.removeEventListener('change', handleOsChange);
  }, []);

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
    setAppearance(prev => ({ ...prev, theme }));
  }

  function setMode(mode) {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = resolveMode(mode, osPrefersDark);
    document.documentElement.setAttribute('data-mode', resolved);
    setAppearance(prev => ({ ...prev, mode, resolvedMode: resolved }));
  }

  function setFont(font) {
    localStorage.setItem(STORAGE_KEYS.font, font);
    document.documentElement.setAttribute('data-font', font);
    setAppearance(prev => ({ ...prev, font }));
  }

  function setMotion(motion) {
    localStorage.setItem(STORAGE_KEYS.motion, motion);
    document.documentElement.setAttribute('data-motion', motion);
    setAppearance(prev => ({ ...prev, motion }));
  }

  return { ...appearance, setTheme, setMode, setFont, setMotion };
}
