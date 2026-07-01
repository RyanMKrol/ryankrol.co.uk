import { Fragment } from 'react';
import V1Layout from './V1Layout';

export default function V1FormShell({
  breadcrumb,
  title,
  message,
  messageType,
  onSubmit,
  children,
}) {
  return (
    <V1Layout breadcrumb={breadcrumb}>
      <div className="v1-form-panel">
        <div className="v1-form-header">
          <span>{title}</span>
        </div>

        {message && (
          <div className={`v1-form-message v1-form-message-${messageType}`}>{message}</div>
        )}

        <form onSubmit={onSubmit}>{children}</form>
      </div>

      <style jsx>{`
        .v1-form-panel {
          max-width: 420px;
        }

        .v1-form-header {
          font-weight: 700;
          color: #6ee7b7;
          padding-bottom: 8px;
          border-bottom: 1px solid #24292b;
          margin-bottom: 8px;
        }

        .v1-form-message {
          padding: 6px 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .v1-form-message-success {
          color: #6ee7b7;
          border: 1px solid #24292b;
        }

        .v1-form-message-error {
          color: #f87171;
          border: 1px solid #24292b;
        }
      `}</style>
    </V1Layout>
  );
}

export function V1FormRow({ label, htmlFor, children }) {
  return (
    <Fragment>
      <div className="v1-form-row">
        <label className="v1-form-label" htmlFor={htmlFor}>
          {label}
        </label>
        <div className="v1-form-value">{children}</div>
      </div>

      <style jsx>{`
        .v1-form-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #1c2022;
        }

        .v1-form-label {
          color: #6b7280;
          flex: 0 0 110px;
          padding-top: 4px;
        }

        .v1-form-value {
          flex: 1;
          min-width: 0;
        }

        .v1-form-value :global(input[type='text']),
        .v1-form-value :global(input[type='password']),
        .v1-form-value :global(input[type='number']),
        .v1-form-value :global(select),
        .v1-form-value :global(textarea) {
          width: 100%;
          background: #131618;
          border: 1px solid #24292b;
          color: #d8dcdd;
          font-family: inherit;
          font-size: 13px;
          padding: 4px 8px;
        }

        .v1-form-value :global(textarea) {
          min-height: 70px;
          resize: vertical;
        }
      `}</style>
    </Fragment>
  );
}

export function V1FormSubmit({ disabled, children }) {
  return (
    <Fragment>
      <button type="submit" className="v1-form-submit" disabled={disabled}>
        {children}
      </button>

      <style jsx>{`
        .v1-form-submit {
          margin-top: 12px;
          background: #131618;
          border: 1px solid #24292b;
          color: #6ee7b7;
          font-family: inherit;
          font-weight: 700;
          padding: 6px 14px;
          cursor: pointer;
        }

        .v1-form-submit:disabled {
          opacity: 0.4;
          cursor: default;
        }
      `}</style>
    </Fragment>
  );
}

export function V1FormActions({ children }) {
  return (
    <Fragment>
      <div className="v1-form-actions">{children}</div>

      <style jsx>{`
        .v1-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>
    </Fragment>
  );
}

export function V1FormDanger({ disabled, onClick, children }) {
  return (
    <Fragment>
      <button type="button" className="v1-form-danger" disabled={disabled} onClick={onClick}>
        {children}
      </button>

      <style jsx>{`
        .v1-form-danger {
          margin-top: 12px;
          background: #131618;
          border: 1px solid #24292b;
          color: #f87171;
          font-family: inherit;
          font-weight: 700;
          padding: 6px 14px;
          cursor: pointer;
        }

        .v1-form-danger:disabled {
          opacity: 0.4;
          cursor: default;
        }
      `}</style>
    </Fragment>
  );
}
