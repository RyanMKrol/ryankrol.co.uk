import { useState } from 'react';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn', 'Day', 'Night'];

const APPLICATION_SPOTS = ['Wrists', 'Elbows', 'Clavicles', 'Beard', 'Back of neck', 'Behind ears', 'Clothes'];

const PROJECTION_LABELS = {
  1: 'Skin scent',
  2: 'Moderate',
  3: 'Strong',
  4: 'Beast mode',
};

export function LongevitySlider({ value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor="longevity">
        Longevity: {value >= 8 ? '8+' : value}
      </label>
      <input
        type="range"
        id="longevity"
        name="longevity"
        min="0"
        max="8"
        step="1"
        value={value}
        onChange={onChange}
        className="form-input"
      />
    </div>
  );
}

export function ProjectionSlider({ value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor="projection">
        Projection: {PROJECTION_LABELS[value]}
      </label>
      <input
        type="range"
        id="projection"
        name="projection"
        min="1"
        max="4"
        step="1"
        value={value}
        onChange={onChange}
        className="form-input"
      />
    </div>
  );
}

export function applicationSpotCounts(applicationSpots) {
  const counts = Object.fromEntries(APPLICATION_SPOTS.map((spot) => [spot, 0]));
  (applicationSpots || []).forEach(({ spot, sprays }) => {
    if (spot in counts) counts[spot] = sprays;
  });
  return counts;
}

export function countsToApplicationSpots(counts) {
  return APPLICATION_SPOTS
    .filter((spot) => counts[spot] > 0)
    .map((spot) => ({ spot, sprays: counts[spot] }));
}

function SpraySpotCounter({ spot, count, onChange }) {
  const [poofs, setPoofs] = useState([]);

  const spray = () => {
    onChange(count + 1);
    const id = poofs.length ? Math.max(...poofs) + 1 : 0;
    setPoofs((current) => [...current, id]);
    setTimeout(() => {
      setPoofs((current) => current.filter((poofId) => poofId !== id));
    }, 600);
  };

  const unspray = (e) => {
    e.preventDefault();
    if (count > 0) onChange(count - 1);
  };

  return (
    <button
      type="button"
      onClick={spray}
      onContextMenu={unspray}
      title="Tap to add a spray, right-click to remove one"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.4rem 0.25rem',
        border: `1px solid ${count > 0 ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
        borderRadius: 'var(--radius-base)',
        background: count > 0 ? 'var(--color-surface-alt)' : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
        minWidth: '3.75rem',
        flex: '0 0 auto',
        font: 'inherit',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          fontSize: '1.1rem',
          lineHeight: 1,
          transformOrigin: 'bottom center',
          animation: poofs.length ? 'spray-squeeze 0.25s ease' : 'none',
        }}
      >
        👃
        {poofs.map((id) => (
          <span
            key={id}
            style={{
              position: 'absolute',
              top: '-0.25rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '1rem',
              pointerEvents: 'none',
              animation: 'spray-poof 0.6s ease-out forwards',
            }}
          >
            💦
          </span>
        ))}
      </span>
      <span className="form-label" style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem' }}>{spot}</span>
      <span
        style={{
          color: count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      >
        {count === 0 ? 'no sprays' : `${count} spray${count === 1 ? '' : 's'}`}
      </span>
      <style jsx>{`
        @keyframes spray-poof {
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.6); }
          100% { opacity: 0; transform: translate(-50%, -1.5rem) scale(1.3); }
        }
        @keyframes spray-squeeze {
          0% { transform: scale(1); }
          40% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
      `}</style>
    </button>
  );
}

export function ApplicationSpotsSprayer({ value, onChange }) {
  const counts = applicationSpotCounts(value);

  const setSprayCount = (spot, count) => {
    onChange(countsToApplicationSpots({ ...counts, [spot]: count }));
  };

  return (
    <div className="form-group">
      <span className="form-label">Application spots — tap the bottle to spray 👃💦</span>
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.25rem',
        }}
      >
        {APPLICATION_SPOTS.map((spot) => (
          <SpraySpotCounter
            key={spot}
            spot={spot}
            count={counts[spot]}
            onChange={(count) => setSprayCount(spot, count)}
          />
        ))}
      </div>
    </div>
  );
}

export function SeasonsCheckboxes({ value, onChange }) {
  const toggleSeason = (season) => {
    const next = value.includes(season)
      ? value.filter((s) => s !== season)
      : [...value, season];
    onChange(next);
  };

  return (
    <div className="form-group">
      <span className="form-label">Seasons</span>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {SEASONS.map((season) => (
          <label className="form-label" key={season}>
            <input
              type="checkbox"
              name="seasons"
              checked={value.includes(season)}
              onChange={() => toggleSeason(season)}
            />
            {' '}{season}
          </label>
        ))}
      </div>
    </div>
  );
}
