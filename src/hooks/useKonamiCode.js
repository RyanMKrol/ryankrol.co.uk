import { useState, useEffect, useCallback } from 'react';

const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

const STORAGE_KEY = 'matrix-active';

export default function useKonamiCode() {
  const [isActive, setIsActive] = useState(false);

  // Initialize from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsActive(true);
      document.documentElement.classList.add('matrix-active');
    }
  }, []);

  const toggle = useCallback(() => {
    setIsActive(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('matrix-active');
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } else {
        document.documentElement.classList.remove('matrix-active');
        sessionStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let buffer = [];

    function handleKeyDown(e) {
      buffer.push(e.code);
      if (buffer.length > KONAMI_SEQUENCE.length) {
        buffer = buffer.slice(-KONAMI_SEQUENCE.length);
      }
      if (buffer.length === KONAMI_SEQUENCE.length &&
          buffer.every((code, i) => code === KONAMI_SEQUENCE[i])) {
        toggle();
        buffer = [];
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return isActive;
}
