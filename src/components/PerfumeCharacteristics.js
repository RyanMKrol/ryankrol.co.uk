import { useState } from 'react';
import PillGroup from './PillGroup';

export const OWNERSHIP_OPTIONS = [
  { value: 'Sample', label: 'Sample' },
  { value: 'Travel size', label: 'Travel size' },
  { value: 'Full bottle', label: 'Full bottle' },
];

export function OwnershipPicker({ value, onChange }) {
  return (
    <div className="form-group">
      <span className="form-label">What I own</span>
      <PillGroup options={OWNERSHIP_OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn', 'Day', 'Night'];

const APPLICATION_SPOTS = ['Wrists', 'Elbows', 'Clavicles', 'Beard', 'Back of neck', 'Behind ears', 'Clothes'];

export const PROJECTION_LABELS = {
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
    <div className="perfume-spray-spot">
      <button
        type="button"
        onClick={spray}
        onContextMenu={unspray}
        title="Tap to add a spray, right-click to remove one"
        className={`perfume-spray-spot-circle${count > 0 ? ' is-active' : ''}`}
      >
        <span className={`perfume-spray-spot-emoji${poofs.length ? ' is-spraying' : ''}`}>
          👃
          {poofs.map((id) => (
            <span key={id} className="perfume-spray-spot-poof">
              💦
            </span>
          ))}
        </span>
        <span className={`perfume-spray-spot-count${count > 0 ? ' is-active' : ''}`}>{count}</span>
      </button>
      <span className="perfume-spray-spot-label">{spot}</span>
    </div>
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
      <div className="perfume-spray-spots">
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
