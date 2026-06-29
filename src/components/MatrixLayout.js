import { useState } from 'react';
import dynamic from 'next/dynamic';
import AppearancePicker from './AppearancePicker';

const MatrixRain = dynamic(() => import('./MatrixRain'), { ssr: false });
const CRTOverlay = dynamic(() => import('./CRTOverlay'), { ssr: false });

export default function MatrixLayout({ active, children }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      {active && <MatrixRain />}
      <div className={active ? 'matrix-content-wrapper' : undefined}>
        {children}
      </div>
      {active && <CRTOverlay />}
      <button
        className="global-appearance-btn"
        onClick={() => setPickerOpen(true)}
        aria-label="Open appearance settings"
        title="Appearance"
      >
        🎨
      </button>
      <AppearancePicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
