import Pill from './Pill';

/**
 * A single-select group of Pills — the shared primitive for sort pills,
 * filter pills, and time-range pills. Controlled via `value`/`onChange`.
 *
 * options: Array<{ value, label }>
 */
export default function PillGroup({ options, value, onChange, accentColor }) {
  return (
    <div className="collection-pill-group">
      {options.map((option) => (
        <Pill
          key={option.value}
          active={value === option.value}
          accentColor={accentColor}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Pill>
      ))}
    </div>
  );
}
