import { useEffect, useState } from 'react';
import Link from 'next/link';
import V3Layout from './V3Layout';

export default function V3EditFeed({ title, apiPath, editHref, getSummary, getKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error(`Failed to fetch ${title}`);
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [apiPath, title]);

  return (
    <V3Layout title={`${title} — edit`}>
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          {items.map((item) => (
            <Link key={getKey(item)} href={editHref(item)} className="v3-edit-row">
              <span className="v3-edit-toggle">→</span>
              <span className="v3-edit-type">[{title}]</span>
              <span>{getSummary(item)}</span>
            </Link>
          ))}

          {items.length === 0 && <p className="v3-status">nothing here yet.</p>}

          <div className="v3-end">— end of feed —</div>
        </>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }

        .v3-edit-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid #ececea;
          color: #1a1a1a;
          text-decoration: none;
        }

        .v3-edit-row:hover {
          background: #f1f1ee;
        }

        .v3-edit-toggle,
        .v3-edit-type {
          color: #767672;
        }

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
