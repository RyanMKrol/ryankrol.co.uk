import { useState } from 'react';

export default function V3AddEntry({ type, onSubmit, children, disabled }) {
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError(false);

    try {
      await onSubmit();
      setMessage('saved.');
      setError(false);
      setExpanded(false);
    } catch (err) {
      setMessage(err.message || 'error saving.');
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="v3-entry">
      <div className="v3-entry-gutter">new</div>
      <div className="v3-entry-body">
        <button type="button" className="v3-entry-summary" onClick={() => setExpanded(!expanded)}>
          <span className="v3-entry-toggle">{expanded ? '−' : '+'}</span>
          <span className="v3-entry-type">[{type}]</span>
          <span>add new entry</span>
        </button>

        {expanded && (
          <form className="v3-add-form" onSubmit={handleSubmit}>
            {children}

            {message && <p className={error ? 'v3-add-message v3-add-error' : 'v3-add-message'}>{message}</p>}

            <button type="submit" className="v3-add-submit" disabled={saving || disabled}>
              {saving ? 'saving…' : 'save'}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .v3-entry {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #ececea;
        }

        .v3-entry-gutter {
          flex: 0 0 84px;
          color: #767672;
          font-variant-numeric: tabular-nums;
        }

        .v3-entry-body {
          flex: 1;
          min-width: 0;
        }

        .v3-entry-summary {
          display: flex;
          align-items: baseline;
          gap: 8px;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: #1a1a1a;
          text-align: left;
          cursor: pointer;
          width: 100%;
        }

        .v3-entry-toggle {
          color: #767672;
        }

        .v3-entry-type {
          color: #767672;
        }

        .v3-add-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 0 4px 20px;
        }

        .v3-add-form :global(label) {
          color: #767672;
          margin-right: 8px;
        }

        .v3-add-form :global(input[type='text']),
        .v3-add-form :global(input[type='password']),
        .v3-add-form :global(input[type='number']),
        .v3-add-form :global(select),
        .v3-add-form :global(textarea) {
          font: inherit;
          background: #fdfdfb;
          border: 1px solid #dcdcd6;
          padding: 4px 6px;
          color: #1a1a1a;
          width: 100%;
          max-width: 480px;
        }

        .v3-add-form :global(textarea) {
          min-height: 60px;
        }

        .v3-add-submit {
          align-self: flex-start;
          font: inherit;
          background: none;
          border: 1px solid #1a1a1a;
          padding: 4px 12px;
          color: #1a1a1a;
          cursor: pointer;
        }

        .v3-add-submit:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .v3-add-message {
          color: #3a3a38;
          margin: 0;
        }

        .v3-add-error {
          color: #a33;
        }
      `}</style>
    </div>
  );
}
