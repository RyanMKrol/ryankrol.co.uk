import dynamic from 'next/dynamic';

const MatrixRain = dynamic(() => import('./MatrixRain'), { ssr: false });
const CRTOverlay = dynamic(() => import('./CRTOverlay'), { ssr: false });

export default function MatrixLayout({ active, children }) {
  return (
    <>
      {active && <MatrixRain />}
      <div className={active ? 'matrix-content-wrapper' : undefined}>
        {children}
      </div>
      {active && <CRTOverlay />}
    </>
  );
}
