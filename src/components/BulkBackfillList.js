import { useEffect, useRef, useState } from 'react';
import { paginate } from '../lib/pagination';
import { runBackfillQueue } from '../lib/backfillQueue';
import Pagination from './Pagination';

/**
 * Dense, paginated list for running a metadata-backfill search across many
 * items at once — the multi-item sibling of MetadataBackfillModal (which
 * handles a single item behind a blocking dialog). Fully generic: the caller
 * supplies the search, rendering, and save behaviour; this component only
 * owns pagination, per-row status, and sequencing the lookups through
 * backfillQueue.js so a page's worth of requests never bursts in parallel.
 *
 *   items          - array of already-filtered domain items, each with a stable `.id`
 *   pageSize       - items per page (default 15)
 *   onSearch       - async (item) => candidates[]
 *   renderItemLabel  - (item) => ReactNode
 *   renderCandidate  - (candidate) => ReactNode
 *   getCandidateKey  - optional (candidate, index) => key
 *   onConfirm      - async (item, candidate) => void
 */
export default function BulkBackfillList({
  items,
  pageSize = 15,
  onSearch,
  minSpacingMs = 1500,
  renderItemLabel,
  renderCandidate,
  getCandidateKey,
  onConfirm,
}) {
  const [page, setPage] = useState(1);
  const [rowState, setRowState] = useState({});
  const [applyingAll, setApplyingAll] = useState(false);
  const controllerRef = useRef(null);

  const { items: pageItems, pageCount } = paginate(items, page, pageSize);

  useEffect(() => {
    controllerRef.current?.cancel();

    const initialState = {};
    pageItems.forEach((item) => {
      initialState[item.id] = { status: 'queued', candidates: null, selectedIndex: null, error: '' };
    });
    setRowState(initialState);

    const controller = runBackfillQueue(
      pageItems,
      onSearch,
      {
        minSpacingMs,
        onItemStart: (item) => {
          setRowState((prev) => ({
            ...prev,
            [item.id]: { ...prev[item.id], status: 'searching' },
          }));
        },
        onItemSettled: (item, { candidates, error }) => {
          setRowState((prev) => ({
            ...prev,
            [item.id]: {
              ...prev[item.id],
              status: error ? 'error' : 'found',
              candidates: error ? null : candidates.slice(0, 10),
              error: error ? (error.message || 'Search failed') : '',
            },
          }));
        },
      }
    );
    controllerRef.current = controller;

    return () => controller.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, items]);

  const selectCandidate = (itemId, index) => {
    setRowState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], selectedIndex: index },
    }));
  };

  const confirmRow = async (item) => {
    const row = rowState[item.id];
    if (!row || row.selectedIndex === null || row.selectedIndex === undefined) return;

    setRowState((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], status: 'saving' },
    }));

    try {
      await onConfirm(item, row.candidates[row.selectedIndex]);
      setRowState((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: 'saved' },
      }));
    } catch (err) {
      setRowState((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], status: 'found', error: err.message || 'Save failed' },
      }));
    }
  };

  const confirmAll = async () => {
    if (applyingAll) return;
    const toApply = pageItems.filter((item) => {
      const row = rowState[item.id];
      return row && row.status === 'found' && row.selectedIndex !== null && row.selectedIndex !== undefined;
    });
    if (toApply.length === 0) return;
    setApplyingAll(true);
    for (const item of toApply) {
      await confirmRow(item);
    }
    setApplyingAll(false);
  };

  const statusLabel = (row) => {
    if (!row) return 'queued';
    switch (row.status) {
      case 'queued': return 'queued';
      case 'searching': return 'searching…';
      case 'found': return row.error || (row.candidates.length === 0 ? 'no matches' : `${row.candidates.length} candidate${row.candidates.length === 1 ? '' : 's'} found`);
      case 'saving': return 'saving…';
      case 'saved': return 'saved';
      case 'error': return row.error || 'error';
      default: return '';
    }
  };

  return (
    <div className="bulk-backfill-list">
      <div className="bbl-page-actions">
        <button
          type="button"
          className="form-button"
          disabled={applyingAll || !pageItems.some((item) => {
            const row = rowState[item.id];
            return row && row.status === 'found' && row.selectedIndex !== null && row.selectedIndex !== undefined;
          })}
          onClick={confirmAll}
        >
          {applyingAll ? 'Applying…' : 'Apply all selections'}
        </button>
      </div>

      {pageItems.map((item) => {
        const row = rowState[item.id];
        const candidates = row?.candidates || [];
        const isSaved = row?.status === 'saved';

        return (
          <div key={item.id} className="bbl-row">
            <div className="bbl-row-header">
              <div className="bbl-row-label">{renderItemLabel(item)}</div>
              <div className="bbl-row-status">{statusLabel(row)}</div>
            </div>

            {row?.status === 'found' && candidates.length > 0 && (
              <div className="bbl-candidates">
                {candidates.map((candidate, i) => {
                  const key = getCandidateKey ? getCandidateKey(candidate, i) : i;
                  return (
                    <label key={key} className="mbm-result-item bbl-candidate-item">
                      <input
                        type="radio"
                        name={`bbl-candidate-${item.id}`}
                        checked={row.selectedIndex === i}
                        onChange={() => selectCandidate(item.id, i)}
                        disabled={isSaved}
                      />
                      <div className="mbm-result-content">{renderCandidate(candidate)}</div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <Pagination currentPage={page} totalPages={pageCount} onPageChange={setPage} />

      <style jsx>{`
        .bulk-backfill-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bbl-row {
          border: var(--border-width) solid var(--color-hairline-strong);
          border-radius: var(--radius-stat);
          padding: 0.75rem;
        }
        .bbl-row-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .bbl-row-status {
          font-size: 0.85rem;
          color: var(--color-ink-mute);
          white-space: nowrap;
        }
        .bbl-candidates {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-top: 0.6rem;
        }
        .bbl-candidate-item {
          padding: 0.4rem;
        }
        .bbl-page-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
