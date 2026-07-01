import { useEffect, useMemo, useState } from 'react';
import V1Layout from './V1Layout';

function parseDdMmYyyy(date) {
  if (!date) return new Date(0);
  return new Date(date.split('-').reverse().join('-'));
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

const PAGE_SIZE = 50;

export default function V1ReviewTable({
  breadcrumb,
  endpoint,
  typeLabel,
  getSecondary,
  getThoughts,
  getMaxRating = () => 5,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${typeLabel}`);
        const data = await response.json();
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [endpoint, typeLabel]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let rows = items.filter((item) => {
      const secondary = getSecondary(item) || '';
      return (
        item.title.toLowerCase().includes(term) ||
        secondary.toLowerCase().includes(term)
      );
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortKey === 'rating') {
        cmp = (a.rating || 0) - (b.rating || 0);
      } else {
        cmp = parseDdMmYyyy(a.date) - parseDdMmYyyy(b.date);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [items, search, sortKey, sortDir]);

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
      setSortDir(key === 'title' ? 'asc' : 'desc');
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <V1Layout breadcrumb={breadcrumb}>
      <div className="v1-review-shell">
        <div className={`v1-table-pane${selected ? ' v1-table-pane-narrow' : ''}`}>
          <input
            className="v1-filter"
            type="text"
            placeholder={`filter ${typeLabel}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p className="v1-status">Loading {typeLabel}…</p>}
          {error && <p className="v1-status v1-status-error">Error: {error}</p>}

          {!loading && !error && (
            <>
              <table className="v1-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('title')}>Title{sortArrow('title')}</th>
                    {!selected && <th>Info</th>}
                    <th onClick={() => toggleSort('rating')} className="v1-numeric">
                      Rating{sortArrow('rating')}
                    </th>
                    <th onClick={() => toggleSort('date')}>Reviewed{sortArrow('date')}</th>
                    {!selected && <th>Excerpt</th>}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item, i) => (
                    <tr
                      key={`${item.title}-${i}`}
                      className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}
                      onClick={() => setSelected(item)}
                    >
                      <td>{item.title}</td>
                      {!selected && <td>{getSecondary(item)}</td>}
                      <td className="v1-numeric">
                        {item.rating != null ? `${item.rating}/${getMaxRating(item)}` : '—'}
                      </td>
                      <td>{item.date}</td>
                      {!selected && <td>{truncate(getThoughts(item), 60)}</td>}
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={selected ? 3 : 5} className="v1-status">
                        No {typeLabel} found.
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
            <div className="v1-detail-row">
              <span className="v1-detail-label">Secondary</span>
              <span>{getSecondary(selected) || '—'}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Rating</span>
              <span>
                {selected.rating != null ? `${selected.rating}/${getMaxRating(selected)}` : '—'}
              </span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Reviewed</span>
              <span>{selected.date}</span>
            </div>
            <div className="v1-detail-row v1-detail-row-block">
              <span className="v1-detail-label">Thoughts</span>
              <p>{getThoughts(selected) || '—'}</p>
            </div>
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

        .v1-numeric {
          text-align: right;
          font-variant-numeric: tabular-nums;
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
