import { useEffect, useState } from 'react';
import V3Layout from './V3Layout';
import V3TimelineEntry from './V3TimelineEntry';

function renderStars(rating, scale) {
  const full = Math.round((rating || 0) / (scale / 5));
  return '★'.repeat(Math.max(0, Math.min(5, full))) + '☆'.repeat(5 - Math.max(0, Math.min(5, full)));
}

function parseDate(dateStr) {
  // dates are stored 'DD-MM-YYYY'
  const [day, month, year] = (dateStr || '').split('-');
  if (!day || !month || !year) return 0;
  return new Date(`${year}-${month}-${day}`).getTime();
}

export default function V3ReviewFeed({
  title,
  apiPath,
  ratingScale = 5,
  getSummary,
  getReviewText,
  getKey,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newestFirst, setNewestFirst] = useState(true);

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

  const sorted = [...items].sort((a, b) => {
    const diff = parseDate(a.date) - parseDate(b.date);
    return newestFirst ? -diff : diff;
  });

  return (
    <V3Layout title={title}>
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="v3-sort">
            sorted by date, {newestFirst ? 'newest first' : 'oldest first'} —{' '}
            <button type="button" className="v3-sort-toggle" onClick={() => setNewestFirst(!newestFirst)}>
              change
            </button>
          </p>

          {sorted.map((item) => (
            <V3TimelineEntry
              key={getKey(item)}
              date={item.date}
              type={title}
              summary={`${getSummary(item)} (${renderStars(item.rating, ratingScale)})`}
            >
              {getReviewText(item) || 'No review text yet.'}
            </V3TimelineEntry>
          ))}

          {sorted.length === 0 && <p className="v3-status">nothing here yet.</p>}

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

        .v3-sort {
          color: #767672;
          margin: 14px 0;
        }

        .v3-sort-toggle {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: #1a1a1a;
          text-decoration: underline;
          cursor: pointer;
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
