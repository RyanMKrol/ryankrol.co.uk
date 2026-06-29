import { useState } from 'react';
import Link from 'next/link';
import NowPlaying from './NowPlaying';
import AppearancePicker from './AppearancePicker';

export default function Header() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-content">
        <Link href="/" className="home-link">
          ← ryankrol.co.uk
        </Link>
        <div className="header-right">
          <div className="header-now-playing">
            <NowPlaying />
          </div>
          <button
            className="header-appearance-btn"
            onClick={() => setPickerOpen(true)}
            aria-label="Open appearance settings"
            title="Appearance"
          >
            🎨
          </button>
        </div>
      </div>
      <AppearancePicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </header>
  );
}
