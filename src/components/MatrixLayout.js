import MatrixRain from './MatrixRain';
import CRTOverlay from './CRTOverlay';

export default function MatrixLayout({ children }) {
  return (
    <>
      <MatrixRain />
      <div className="matrix-content-wrapper">
        {children}
      </div>
      <CRTOverlay />
    </>
  );
}
