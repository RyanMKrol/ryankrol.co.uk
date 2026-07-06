export default function Tooltip({ label, children, position = 'top', className }) {
  return (
    <span
      className={`tooltip-wrapper${className ? ' ' + className : ''}`}
      tabIndex={0}
      aria-label={label}
    >
      {children}
      <span
        className={`tooltip-bubble${position === 'bottom' ? ' tooltip-bubble--bottom' : ''}`}
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  );
}
