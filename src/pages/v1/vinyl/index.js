import { useEffect, useMemo, useState } from 'react';
import V1Layout from '../../../components/v1/V1Layout';

const PAGE_SIZE = 50;

function sortingArtist(artist) {
  if (!artist) return '';
  return artist.replace(/^The\s+/i, '').trim();
}

export default function V1VinylPage() {
  const [vinyl, setVinyl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('artist');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVinyl() {
      try {
        const response = await fetch('/api/vinyl');
        if (!response.ok) throw new Error('Failed to fetch vinyl collection');
        const data = await response.json();
        if (!cancelled) setVinyl(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVinyl();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let rows = vinyl.filter((item) => (
      (item.title || '').toLowerCase().includes(term) ||
      (item.artist || '').toLowerCase().includes(term)
    ));

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else {
        cmp = sortingArtist(a.artist).localeCompare(sortingArtist(b.artist));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [vinyl, search, sortKey, sortDir]);

  useEffect(() => {
    setPage(0);
  }, [search, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, page * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <V1Layout breadcrumb="~ / vinyl">
      <div className="v1-review-shell">
        <div className={`v1-table-pane${selected ? ' v1-table-pane-narrow' : ''}`}>
          <input
            className="v1-filter"
            type="text"
            placeholder="filter vinyl…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p className="v1-status">Loading vinyl…</p>}
          {error && <p className="v1-status v1-status-error">Error: {error}</p>}

          {!loading && !error && (
            <>
              <table className="v1-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('title')}>Title{sortArrow('title')}</th>
                    <th onClick={() => toggleSort('artist')}>Artist{sortArrow('artist')}</th>
                    {!selected && <th>Format</th>}
                    {!selected && <th>Label</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((record, i) => (
                    <tr
                      key={`${record.artist}-${record.title}-${i}`}
                      className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}
                      onClick={() => setSelected(record)}
                    >
                      <td>{record.title || 'Unknown Title'}</td>
                      <td>{record.artist || 'Unknown Artist'}</td>
                      {!selected && <td>{record.format || '—'}</td>}
                      {!selected && <td>{record.label || '—'}</td>}
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={selected ? 2 : 4} className="v1-status">
                        No vinyl records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="v1-table-foot">
                <span>
                  {rangeStart}–{rangeEnd} of {filtered.length}
                </span>
                <span className="v1-pager">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    ›
                  </button>
                </span>
              </div>
            </>
          )}
        </div>

        {selected && (
          <div className="v1-detail-panel">
            <div className="v1-detail-header">
              <span>{selected.title}</span>
              <button type="button" className="v1-detail-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            {selected.thumbnail && (
              <div className="v1-detail-row v1-detail-row-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.thumbnail} alt={selected.title} width={120} height={120} />
              </div>
            )}
            <div className="v1-detail-row">
              <span className="v1-detail-label">Artist</span>
              <span>{selected.artist || '—'}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Format</span>
              <span>{selected.format || '—'}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Label</span>
              <span>{selected.label || '—'}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Condition</span>
              <span>{selected.condition || '—'}</span>
            </div>
            {selected.notes && (
              <div className="v1-detail-row v1-detail-row-block">
                <span className="v1-detail-label">Notes</span>
                <p>{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .v1-review-shell {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .v1-table-pane {
          flex: 1;
          min-width: 0;
        }

        .v1-table-pane-narrow {
          max-width: calc(100% - 436px);
        }

        .v1-filter {
          background: #131618;
          border: 1px solid #24292b;
          color: #d8dcdd;
          font-family: inherit;
          font-size: 13px;
          padding: 6px 8px;
          width: 100%;
          margin-bottom: 8px;
        }

        .v1-status {
          color: #6b7280;
          padding: 8px 0;
        }

        .v1-status-error {
          color: #f87171;
        }

        .v1-table {
          width: 100%;
          border-collapse: collapse;
        }

        .v1-table th,
        .v1-table td {
          text-align: left;
          padding: 6px 10px;
          height: 34px;
          border-bottom: 1px solid #1c2022;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .v1-table th {
          font-weight: 700;
          color: #6ee7b7;
          cursor: pointer;
          user-select: none;
        }

        .v1-row-even {
          background: #101314;
        }

        .v1-row-odd {
          background: #0d0f10;
        }

        .v1-table tbody tr:hover {
          background: #1c2022;
          cursor: pointer;
        }

        .v1-table-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          color: #6b7280;
          font-size: 13px;
        }

        .v1-pager button {
          background: #131618;
          border: 1px solid #24292b;
          color: #d8dcdd;
          font-family: inherit;
          padding: 2px 10px;
          margin-left: 6px;
          cursor: pointer;
        }

        .v1-pager button:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .v1-detail-panel {
          flex: 0 0 420px;
          width: 420px;
          border-left: 1px solid #24292b;
          padding-left: 16px;
        }

        .v1-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          color: #6ee7b7;
          padding-bottom: 8px;
          border-bottom: 1px solid #24292b;
          margin-bottom: 8px;
        }

        .v1-detail-close {
          background: none;
          border: none;
          color: #d8dcdd;
          font-size: 16px;
          cursor: pointer;
        }

        .v1-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #1c2022;
        }

        .v1-detail-row-block {
          flex-direction: column;
          gap: 4px;
        }

        .v1-detail-label {
          color: #6b7280;
        }
      `}</style>
    </V1Layout>
  );
}
