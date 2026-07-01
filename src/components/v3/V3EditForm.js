import { useState } from 'react';

export default function V3EditForm({ type, onSubmit, onDelete, children, submitDisabled, deleteDisabled }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    } catch (err) {
      setMessage(err.message || 'error saving.');
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('delete this entry? this cannot be undone.')) return;

    setDeleting(true);
    setMessage('');
    setError(false);

    try {
      await onDelete();
      setMessage('deleted.');
      setError(false);
    } catch (err) {
      setMessage(err.message || 'error deleting.');
      setError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="v3-entry">
      <div className="v3-entry-gutter">[{type}]</div>
      <div className="v3-entry-body">
        <form className="v3-edit-form" onSubmit={handleSubmit}>
          {children}

          {message && <p className={error ? 'v3-edit-message v3-edit-error' : 'v3-edit-message'}>{message}</p>}

          <div className="v3-edit-actions">
            <button type="submit" className="v3-edit-submit" disabled={saving || deleting || submitDisabled}>
              {saving ? 'saving…' : 'save'}
            </button>
            <button
              type="button"
              className="v3-edit-delete"
              onClick={handleDelete}
              disabled={saving || deleting || deleteDisabled}
            >
              {deleting ? 'deleting…' : 'delete'}
            </button>
          </div>
        </form>
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
        }

        .v3-entry-body {
          flex: 1;
          min-width: 0;
        }

        .v3-edit-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .v3-edit-form :global(label) {
          color: #767672;
          margin-right: 8px;
        }

        .v3-edit-form :global(input[type='text']),
        .v3-edit-form :global(input[type='password']),
        .v3-edit-form :global(input[type='number']),
        .v3-edit-form :global(select),
        .v3-edit-form :global(textarea) {
          font: inherit;
          background: #fdfdfb;
          border: 1px solid #dcdcd6;
          padding: 4px 6px;
          color: #1a1a1a;
          width: 100%;
          max-width: 480px;
        }

        .v3-edit-form :global(input:disabled) {
          color: #767672;
          background: #f1f1ee;
        }

        .v3-edit-form :global(textarea) {
          min-height: 60px;
        }

        .v3-edit-actions {
          display: flex;
          gap: 8px;
        }

        .v3-edit-submit,
        .v3-edit-delete {
          align-self: flex-start;
          font: inherit;
          background: none;
          border: 1px solid #1a1a1a;
          padding: 4px 12px;
          color: #1a1a1a;
          cursor: pointer;
        }

        .v3-edit-delete {
          border-color: #a33;
          color: #a33;
        }

        .v3-edit-submit:disabled,
        .v3-edit-delete:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .v3-edit-message {
          color: #3a3a38;
          margin: 0;
        }

        .v3-edit-error {
          color: #a33;
        }
      `}</style>
    </div>
  );
}
