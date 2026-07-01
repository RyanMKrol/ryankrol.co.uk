import { useEffect, useMemo, useState } from 'react';
import V1Layout from '../../../components/v1/V1Layout';

const PAGE_SIZE = 50;

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB');
}

export default function V1ProjectsPage() {
  const [repos, setRepos] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('lastPush');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (!response.ok) throw new Error('Failed to fetch GitHub repositories');
        const data = await response.json();
        if (!cancelled) {
          setRepos(data.repos || []);
          setUsername(data.username || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRepos();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let rows = repos.filter((repo) => (
      (repo.name || '').toLowerCase().includes(term) ||
      (repo.description || '').toLowerCase().includes(term) ||
      (repo.language || '').toLowerCase().includes(term)
    ));

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (sortKey === 'stars') {
        cmp = (a.stars || 0) - (b.stars || 0);
      } else if (sortKey === 'forks') {
        cmp = (a.forks || 0) - (b.forks || 0);
      } else {
        cmp = new Date(a.lastPush || 0) - new Date(b.lastPush || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [repos, search, sortKey, sortDir]);

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
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <V1Layout breadcrumb={`~ / projects${username ? ` / @${username}` : ''}`}>
      <div className="v1-review-shell">
        <div className={`v1-table-pane${selected ? ' v1-table-pane-narrow' : ''}`}>
          <input
            className="v1-filter"
            type="text"
            placeholder="filter repos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p className="v1-status">Loading projects…</p>}
          {error && <p className="v1-status v1-status-error">Error: {error}</p>}

          {!loading && !error && (
            <>
              <table className="v1-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')}>Repo{sortArrow('name')}</th>
                    {!selected && <th>Language</th>}
                    {!selected && <th>Description</th>}
                    <th onClick={() => toggleSort('stars')} className="v1-numeric">
                      ★{sortArrow('stars')}
                    </th>
                    <th onClick={() => toggleSort('forks')} className="v1-numeric">
                      Forks{sortArrow('forks')}
                    </th>
                    <th onClick={() => toggleSort('lastPush')}>Updated{sortArrow('lastPush')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((repo, i) => (
                    <tr
                      key={repo.fullName}
                      className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}
                      onClick={() => setSelected(repo)}
                    >
                      <td>
                        {repo.name}
                        {repo.isPrivate && <span className="v1-badge">private</span>}
                      </td>
                      {!selected && <td>{repo.language || '—'}</td>}
                      {!selected && <td>{repo.description || '—'}</td>}
                      <td className="v1-numeric">{repo.stars || 0}</td>
                      <td className="v1-numeric">{repo.forks || 0}</td>
                      <td>{formatDate(repo.lastPush)}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={selected ? 4 : 6} className="v1-status">
                        No repositories found.
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
              <span>{selected.name}</span>
              <button type="button" className="v1-detail-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Language</span>
              <span>{selected.language || '—'}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Stars</span>
              <span>{selected.stars || 0}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Forks</span>
              <span>{selected.forks || 0}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Updated</span>
              <span>{formatDate(selected.lastPush)}</span>
            </div>
            <div className="v1-detail-row">
              <span className="v1-detail-label">Link</span>
              <a href={selected.url} target="_blank" rel="noopener noreferrer">
                github ↗
              </a>
            </div>
            {selected.description && (
              <div className="v1-detail-row v1-detail-row-block">
                <span className="v1-detail-label">Description</span>
                <p>{selected.description}</p>
              </div>
            )}
            {selected.topics && selected.topics.length > 0 && (
              <div className="v1-detail-row v1-detail-row-block">
                <span className="v1-detail-label">Topics</span>
                <p>{selected.topics.join(', ')}</p>
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

        .v1-badge {
          margin-left: 8px;
          font-size: 11px;
          color: #6b7280;
          border: 1px solid #24292b;
          padding: 1px 5px;
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

        .v1-detail-row a {
          color: #6ee7b7;
        }
      `}</style>
    </V1Layout>
  );
}
