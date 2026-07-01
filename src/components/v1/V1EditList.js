import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import V1Layout from './V1Layout';

function parseDdMmYyyy(date) {
  if (!date) return new Date(0);
  return new Date(date.split('-').reverse().join('-'));
}

export default function V1EditList({ breadcrumb, endpoint, typeLabel, getSecondary, getEditHref }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const sorted = useMemo(
    () => [...items].sort((a, b) => parseDdMmYyyy(b.date) - parseDdMmYyyy(a.date)),
    [items],
  );

  return (
    <V1Layout breadcrumb={breadcrumb}>
      {loading && <p className="v1-status">Loading {typeLabel}…</p>}
      {error && <p className="v1-status v1-status-error">Error: {error}</p>}

      {!loading && !error && (
        <table className="v1-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Info</th>
              <th className="v1-numeric">Rating</th>
              <th>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr key={`${item.title}-${i}`} className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}>
                <td colSpan={4} style={{ padding: 0 }}>
                  <Link href={getEditHref(item)} className="v1-edit-row-link">
                    <span className="v1-edit-cell v1-edit-cell-title">{item.title}</span>
                    <span className="v1-edit-cell">{getSecondary(item) || '—'}</span>
                    <span className="v1-edit-cell v1-numeric">{item.rating != null ? item.rating : '—'}</span>
                    <span className="v1-edit-cell">{item.date}</span>
                  </Link>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="v1-status">
                  No {typeLabel} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <style jsx>{`
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

        .v1-edit-row-link {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr;
          align-items: center;
          text-decoration: none;
          color: inherit;
          height: 34px;
        }

        .v1-edit-cell {
          padding: 6px 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-variant-numeric: tabular-nums;
        }

        .v1-edit-cell-title {
          font-weight: 700;
        }
      `}</style>
    </V1Layout>
  );
}
