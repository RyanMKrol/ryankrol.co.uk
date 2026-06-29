import { useEffect, useCallback } from 'react';
import useTheme from '../hooks/useTheme';

const THEMES = [
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '💜' },
  { id: 'terraria', label: 'Terraria', emoji: '🌿' },
  { id: 'cotton-candy', label: 'Cotton Candy', emoji: '🍬' },
  { id: 'sunset', label: 'Sunset', emoji: '🌅' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
];

const FONTS = [
  { id: 'theme', label: 'Theme Font', fontFamily: null },
  { id: 'share-tech-mono', label: 'Share Tech Mono', fontFamily: "'Share Tech Mono', monospace" },
  { id: 'vt323', label: 'VT323', fontFamily: "'VT323', monospace" },
  { id: 'nunito', label: 'Nunito', fontFamily: "'Nunito', sans-serif" },
  { id: 'space-mono', label: 'Space Mono', fontFamily: "'Space Mono', monospace" },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', fontFamily: "'JetBrains Mono', monospace" },
];

const MODES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' },
];

export default function AppearancePicker({ isOpen, onClose }) {
  const { theme, font, mode, motion, setTheme, setFont, setMode, setMotion } = useTheme();

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="ap-overlay" onClick={onClose} role="presentation">
      <div
        className="ap-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Appearance settings"
      >
        <div className="ap-header">
          <h2 className="ap-title">🎨 Appearance</h2>
          <button className="ap-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <section className="ap-section">
          <div className="ap-section-label">THEME</div>
          <div className="ap-tile-grid">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={'ap-tile' + (theme === t.id ? ' ap-tile--active' : '')}
                onClick={() => setTheme(t.id)}
              >
                <span className="ap-tile-emoji">{t.emoji}</span>
                <span className="ap-tile-name">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ap-section">
          <div className="ap-section-label">FONT</div>
          <div className="ap-tile-grid">
            {FONTS.map(f => (
              <button
                key={f.id}
                className={'ap-tile' + (font === f.id ? ' ap-tile--active' : '')}
                onClick={() => setFont(f.id)}
                style={f.fontFamily ? { fontFamily: f.fontFamily } : undefined}
              >
                <span className="ap-tile-name">{f.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ap-section">
          <div className="ap-section-label">MODE</div>
          <div className="ap-tile-grid ap-tile-grid--3">
            {MODES.map(m => (
              <button
                key={m.id}
                className={'ap-tile' + (mode === m.id ? ' ap-tile--active' : '')}
                onClick={() => setMode(m.id)}
              >
                <span className="ap-tile-name">{m.label}</span>
              </button>
            ))}
          </div>
          <p className="ap-helper">System follows your OS dark/light preference.</p>
        </section>

        <label className="ap-reduce-motion">
          <input
            type="checkbox"
            checked={motion === 'reduced'}
            onChange={e => setMotion(e.target.checked ? 'reduced' : 'full')}
          />
          <span>Reduce motion &amp; minimise emoji</span>
        </label>
      </div>
    </div>
  );
}
