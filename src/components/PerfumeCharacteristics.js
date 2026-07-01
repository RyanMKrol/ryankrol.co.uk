const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn', 'Day', 'Night'];

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
