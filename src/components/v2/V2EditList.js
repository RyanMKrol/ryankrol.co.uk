import { useEffect, useState } from 'react';
import Link from 'next/link';
import V2Layout from './V2Layout';

function Stars({ rating, max, size }) {
  const outOfFive = max === 10 ? Math.round(rating / 2) : Math.round(rating || 0);
  return (
    <span className="v2-stars" style={{ fontSize: size }}>
      {'★'.repeat(outOfFive)}
      {'☆'.repeat(5 - outOfFive)}
      <style jsx>{`
        .v2-stars {
          color: #b8863f;
          letter-spacing: 0.05em;
        }
      `}</style>
    </span>
  );
}

export default function V2EditList({
  title,
  apiPath,
  ratingMax = 5,
  getTitle,
  getSubtitle,
  getExcerpt,
  getEditHref,
  getKey,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      try {
        const response = await fetch(apiPath);
        if (!response.ok) throw new Error(`Failed to fetch ${title.toLowerCase()}`);
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
  }, [apiPath, title]);

  return (
    <V2Layout>
      <div className="v2-list-header">
        <span className="v2-hero-kicker">Manage</span>
        <h1 className="v2-list-title">Edit {title}</h1>
      </div>

      {loading && <p className="v2-status">Loading {title.toLowerCase()}…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="v2-status">No {title.toLowerCase()} yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="v2-masonry">
          {items.map((item, i) => (
            <article key={getKey(item, i)} className="v2-review-card">
              <h3 className="v2-card-title">{getTitle(item)}</h3>
              {getSubtitle(item) && <p className="v2-card-subtitle">{getSubtitle(item)}</p>}
              <Stars rating={item.rating} max={ratingMax} size="1rem" />
              {getExcerpt(item) && <p className="v2-card-excerpt">{getExcerpt(item)}</p>}
              <Link href={getEditHref(item)} className="v2-edit-link">Edit →</Link>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .v2-list-header {
          margin-bottom: 24px;
        }

        .v2-list-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          margin: 4px 0 0;
          text-transform: capitalize;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-masonry {
          columns: 3;
          column-gap: 20px;
        }

        @media (max-width: 900px) {
          .v2-masonry {
            columns: 2;
          }
        }

        @media (max-width: 600px) {
          .v2-masonry {
            columns: 1;
          }
        }

        .v2-review-card {
          break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 20px;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.4rem;
          margin: 0 0 4px;
        }

        .v2-card-subtitle {
          font-size: 0.85rem;
          color: #8a8474;
          margin: 0 0 8px;
        }

        .v2-card-excerpt {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 0.95rem;
          line-height: 1.55;
          color: #4b473f;
          margin: 10px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .v2-edit-link {
          display: inline-block;
          margin-top: 12px;
          font-size: 0.85rem;
          color: #211f1c;
          text-decoration: underline;
        }
      `}</style>
    </V2Layout>
  );
}
