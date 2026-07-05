import { useState } from 'react';

const PIP_COUNT = 10;

export default function PipMeter({
  value,
  onChange,
  readOnly = false,
  onHoverChange = () => {},
}) {
  const [hoveredPip, setHoveredPip] = useState(0);

  if (readOnly) {
    return (
      <div className="pip-meter">
        {Array.from({ length: PIP_COUNT }, (_, i) => i + 1).map((pip) => (
          <span
            key={pip}
            className={`pip-dot ${pip <= value ? 'filled' : 'empty'}`}
          />
        ))}
      </div>
    );
  }

  const handlePipClick = (pipValue) => {
    onChange(pipValue);
  };

  const handlePipHover = (pipValue) => {
    setHoveredPip(pipValue);
    onHoverChange(pipValue);
  };

  const handleMouseLeave = () => {
    setHoveredPip(0);
    onHoverChange(0);
  };

  return (
    <div className="pip-meter" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: PIP_COUNT }, (_, i) => i + 1).map((pip) => (
        <button
          key={pip}
          type="button"
          className={`pip-dot interactive ${
            pip <= (hoveredPip || value) ? 'filled' : 'empty'
          }`}
          onClick={() => handlePipClick(pip)}
          onMouseEnter={() => handlePipHover(pip)}
        />
      ))}
    </div>
  );
}
