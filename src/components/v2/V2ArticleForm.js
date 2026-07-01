import { useState } from 'react';
import V2Layout from './V2Layout';

export function V2StarPicker({ rating, onChange, max = 5 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <span className="v2-byline-stars" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          role="button"
          tabIndex={0}
          onClick={() => onChange(star)}
          onKeyDown={(e) => e.key === 'Enter' && onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className={star > (hovered || rating) ? 'v2-star-off' : ''}
        >
          ★
        </span>
      ))}
      {' '}
      <span className="v2-range-value">{rating}/{max}</span>
    </span>
  );
}

export default function V2ArticleForm({
  kicker,
  headline,
  onSubmit,
  submitLabel,
  loading,
  message,
  messageType,
  children,
}) {
  return (
    <V2Layout>
      <div className="v2-article-shell">
        <span className="v2-hero-kicker">{kicker}</span>
        <h1 className="v2-article-headline">{headline}</h1>

        {message && (
          <p className={`v2-form-message ${messageType === 'success' ? 'v2-form-success' : 'v2-form-error'}`}>
            {message}
          </p>
        )}

        <form onSubmit={onSubmit} className="v2-article-form">
          {children}
          <button type="submit" className="v2-submit-button" disabled={loading}>
            {loading ? 'Saving…' : submitLabel}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .v2-article-shell {
          max-width: 680px;
          margin: 0 auto;
        }

        .v2-article-headline {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.75rem;
          margin: 8px 0 32px;
          line-height: 1.1;
        }

        .v2-form-message {
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .v2-form-success {
          background: #eef4e8;
          color: #3c5a2c;
        }

        .v2-form-error {
          background: #f6e6e2;
          color: #8a3324;
        }

        .v2-article-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .v2-field-label {
          display: block;
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
          margin-bottom: 6px;
        }

        .v2-input,
        .v2-textarea,
        .v2-select {
          width: 100%;
          font-family: inherit;
          font-size: 1.05rem;
          color: #211f1c;
          background: transparent;
          border: none;
          border-bottom: 1px solid #c9c3b3;
          padding: 6px 2px;
          outline: none;
        }

        .v2-input:focus,
        .v2-textarea:focus,
        .v2-select:focus {
          border-bottom-color: #211f1c;
        }

        .v2-headline-input {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2rem;
        }

        .v2-textarea {
          font-family: Georgia, 'Times New Roman', serif;
          line-height: 1.6;
          min-height: 140px;
          resize: vertical;
        }

        .v2-checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }

        .v2-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .v2-range-value {
          font-size: 0.85rem;
          color: #8a8474;
        }

        .v2-submit-button {
          align-self: flex-start;
          margin-top: 8px;
          padding: 12px 28px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.05rem;
          background: #211f1c;
          color: #faf8f3;
          border: none;
          cursor: pointer;
        }

        .v2-submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .v2-byline-stars {
          color: #b8863f;
          font-size: 1.4rem;
          letter-spacing: 0.08em;
          cursor: pointer;
        }

        .v2-byline-stars .v2-star-off {
          color: #d8d3c4;
        }
      `}</style>
    </V2Layout>
  );
}
