import { DATE_RANGES } from '../lib/dateRange';

const containerStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const btnBase = {
  padding: '0.35rem 0.9rem',
  border: '1px solid var(--color-accent)',
  borderRadius: '4px',
  background: 'transparent',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
};

const btnActive = {
  ...btnBase,
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
};

export default function DateRangeFilter({ value, onChange }) {
  return (
    <div style={containerStyle}>
      {DATE_RANGES.map((range) => (
        <button
          key={range.key}
          style={value === range.key ? btnActive : btnBase}
          onClick={() => onChange(range.key)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
