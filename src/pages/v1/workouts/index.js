import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import V1Layout from '../../../components/v1/V1Layout';
import { filterWorkouts } from '../../../lib/workoutPagination';

const PAGE_SIZE = 50;
const FILTERS = ['all', 'push', 'pull', 'legs'];

export default function V1WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('start_time');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkouts() {
      try {
        const response = await fetch('/api/workouts?mode=all');
        if (!response.ok) throw new Error('Failed to fetch workouts');
        const data = await response.json();
        if (!cancelled) setWorkouts(data.workouts || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWorkouts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const rows = filterWorkouts(workouts, filter);

    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortKey === 'totalVolume') {
        cmp = (a.totalVolume || 0) - (b.totalVolume || 0);
      } else {
        cmp = new Date(a.start_time) - new Date(b.start_time);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [workouts, filter, sortKey, sortDir]);

  useEffect(() => {
    setPage(0);
  }, [filter, sortKey, sortDir]);

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
    <V1Layout breadcrumb="~ / workouts">
      <div className="v1-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`v1-filter-pill${filter === f ? ' v1-filter-pill-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="v1-status">Loading workouts…</p>}
      {error && <p className="v1-status v1-status-error">Error: {error}</p>}

      {!loading && !error && (
        <>
          <table className="v1-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('title')}>Title{sortArrow('title')}</th>
                <th onClick={() => toggleSort('start_time')}>Date{sortArrow('start_time')}</th>
                <th className="v1-numeric">Duration</th>
                <th onClick={() => toggleSort('totalVolume')} className="v1-numeric">
                  Volume{sortArrow('totalVolume')}
                </th>
                <th className="v1-numeric">Sets</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((workout, i) => (
                <tr
                  key={workout.id || i}
                  className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}
                >
                  <td colSpan={5} style={{ padding: 0 }}>
                    <Link href={`/v1/workouts/${workout.id}`} className="v1-workout-row-link">
                      <span className="v1-workout-cell v1-workout-cell-title">
                        {workout.title || 'Untitled Workout'}
                      </span>
                      <span className="v1-workout-cell">
                        {workout.start_time ? new Date(workout.start_time).toLocaleDateString('en-GB') : '—'}
                      </span>
                      <span className="v1-workout-cell v1-numeric">
                        {duration(workout.start_time, workout.end_time)}
                      </span>
                      <span className="v1-workout-cell v1-numeric">
                        {workout.totalVolume ? `${workout.totalVolume.toLocaleString()}kg` : '—'}
                      </span>
                      <span className="v1-workout-cell v1-numeric">
                        {workout.totalWorkingSets || '—'}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="v1-status">
                    No workouts found.
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

      <style jsx>{`
        .v1-filter-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .v1-filter-pill {
          background: #131618;
          border: 1px solid #24292b;
          color: #6b7280;
          font-family: inherit;
          font-size: 13px;
          text-transform: capitalize;
          padding: 4px 12px;
          cursor: pointer;
        }

        .v1-filter-pill-active {
          color: #6ee7b7;
          font-weight: 700;
          border-color: #6ee7b7;
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

        .v1-table th {
          text-align: left;
          padding: 6px 10px;
          height: 34px;
          border-bottom: 1px solid #1c2022;
          font-weight: 700;
          color: #6ee7b7;
          cursor: pointer;
          user-select: none;
        }

        .v1-numeric {
          text-align: right;
        }

        .v1-row-even {
          background: #101314;
        }

        .v1-row-odd {
          background: #0d0f10;
        }

        .v1-table tbody tr:hover {
          background: #1c2022;
        }

        .v1-workout-row-link {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          align-items: center;
          text-decoration: none;
          color: inherit;
          height: 34px;
        }

        .v1-workout-cell {
          padding: 6px 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-variant-numeric: tabular-nums;
        }

        .v1-workout-cell-title {
          font-weight: 700;
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
      `}</style>
    </V1Layout>
  );
}

function duration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const diffMins = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}
