import { useCallback, useEffect, useState } from 'react';

/**
 * Generic "search an external API, pick a match, confirm" modal.
 *
 * Reusable across review types (books/albums/movies/tv) — it holds no
 * knowledge of any specific type's fields or endpoints. The caller supplies:
 *
 *   buttonLabel  - text for the trigger button (default 'Backfill from API')
 *   onSearch     - () => Promise<Array<any>> - runs the lookup, returns candidates
 *   renderResult - (result) => ReactNode - renders one candidate in the list
 *   onConfirm    - (result) => void - called with the selected candidate on confirm
 *   getResultKey - (result, index) => string|number - optional React key extractor
 */
export default function MetadataBackfillModal({
  buttonLabel = 'Backfill from API',
  onSearch,
  renderResult,
  onConfirm,
  getResultKey,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null); // null = not yet searched
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setResults(null);
    setError('');
    setSelectedIndex(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleClose();
  }, [handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleOpen = async () => {
    setIsOpen(true);
    setSearching(true);
    setError('');
    setResults(null);
    setSelectedIndex(null);

    try {
      const found = await onSearch();
      setResults(found || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selectedIndex === null || !results) return;
    onConfirm(results[selectedIndex]);
    handleClose();
  };

  return (
    <>
      <button type="button" className="form-button mbm-trigger" onClick={handleOpen}>
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="mbm-overlay" onClick={handleClose} role="presentation">
          <div
            className="mbm-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Backfill from API"
          >
            <div className="mbm-header">
              <h2 className="mbm-title">Select a match</h2>
              <button className="mbm-close" onClick={handleClose} aria-label="Close">×</button>
            </div>

            {searching && <p className="mbm-status">Searching…</p>}
            {error && <p className="error-message">{error}</p>}

            {!searching && !error && results !== null && (
              results.length === 0 ? (
                <p className="mbm-status">No matches found.</p>
              ) : (
                <div className="mbm-results">
                  {results.map((result, i) => {
                    const key = getResultKey ? getResultKey(result, i) : i;
                    return (
                      <label key={key} className="mbm-result-item">
                        <input
                          type="radio"
                          name="mbm-result"
                          checked={selectedIndex === i}
                          onChange={() => setSelectedIndex(i)}
                        />
                        <div className="mbm-result-content">{renderResult(result)}</div>
                      </label>
                    );
                  })}
                </div>
              )
            )}

            <div className="mbm-actions">
              <button type="button" className="form-button mbm-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="button"
                className="form-button"
                onClick={handleConfirm}
                disabled={selectedIndex === null}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mbm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .mbm-card {
          background: var(--color-card);
          border: var(--border-width) solid var(--color-ink);
          border-radius: var(--radius-card);
          padding: 1.25rem;
          max-width: 480px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }
        .mbm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .mbm-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.1rem;
          color: var(--color-ink);
        }
        .mbm-close {
          background: none;
          border: none;
          color: var(--color-ink);
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
        }
        .mbm-close:hover {
          color: var(--color-ink-soft);
        }
        .mbm-status {
          font-size: 0.9rem;
          color: var(--color-ink-mute);
        }
        .mbm-results {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .mbm-result-item {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          padding: 0.5rem;
          border: var(--border-width) solid var(--color-hairline-strong);
          border-radius: var(--radius-stat);
          cursor: pointer;
        }
        .mbm-result-item:hover {
          border-color: var(--color-ink);
        }
        .mbm-result-content {
          flex: 1;
          min-width: 0;
        }
        .mbm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .mbm-cancel-btn {
          background: none;
          border: var(--border-width) solid var(--color-ink);
        }
      `}</style>
    </>
  );
}
