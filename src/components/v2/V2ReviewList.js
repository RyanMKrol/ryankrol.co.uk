import { useEffect, useMemo, useState } from 'react';
import V2Layout from './V2Layout';

function parseDdMmYyyy(dateStr) {
  if (!dateStr) return new Date(0);
  return new Date(dateStr.split('-').reverse().join('-'));
}

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

export default function V2ReviewList({
  title,
  apiPath,
  ratingMax = 5,
  getTitle,
  getSubtitle,
  getExcerpt,
  getDate,
  getKey,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

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

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sortBy === 'oldest') {
      copy.sort((a, b) => parseDdMmYyyy(getDate(a)) - parseDdMmYyyy(getDate(b)));
    } else if (sortBy === 'title') {
      copy.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
    } else if (sortBy === 'score') {
      copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      copy.sort((a, b) => parseDdMmYyyy(getDate(b)) - parseDdMmYyyy(getDate(a)));
    }
    return copy;
  }, [items, sortBy, getDate, getTitle]);

  const [featured, ...rest] = sorted;

  return (
    <V2Layout>
      <div className="v2-list-header">
        <h1 className="v2-list-title">{title}</h1>
        <select
          className="v2-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort"
        >
          <option value="newest">Sort: Newest ▾</option>
          <option value="oldest">Sort: Oldest ▾</option>
          <option value="title">Sort: Title ▾</option>
          <option value="score">Sort: Rating ▾</option>
        </select>
      </div>

      {loading && <p className="v2-status">Loading {title.toLowerCase()}…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}

      {!loading && !error && sorted.length === 0 && (
        <p className="v2-status">No {title.toLowerCase()} yet.</p>
      )}

      {!loading && !error && featured && (
        <article className="v2-hero-review">
          <span className="v2-hero-kicker">Latest {title.toLowerCase().replace(/s$/, '')}</span>
          <h2 className="v2-hero-review-title">{getTitle(featured)}</h2>
          {getSubtitle(featured) && <p className="v2-hero-subtitle">{getSubtitle(featured)}</p>}
          <Stars rating={featured.rating} max={ratingMax} size="1.75rem" />
          {getExcerpt(featured) && <p className="v2-hero-pullquote">&ldquo;{getExcerpt(featured)}&rdquo;</p>}
        </article>
      )}

      {!loading && !error && rest.length > 0 && (
        <div className="v2-masonry">
          {rest.map((item, i) => (
            <article key={getKey(item, i)} className="v2-review-card">
              <h3 className="v2-card-title">{getTitle(item)}</h3>
              {getSubtitle(item) && <p className="v2-card-subtitle">{getSubtitle(item)}</p>}
              <Stars rating={item.rating} max={ratingMax} size="1rem" />
              {getExcerpt(item) && <p className="v2-card-excerpt">{getExcerpt(item)}</p>}
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .v2-list-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .v2-list-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          margin: 0;
          text-transform: capitalize;
        }

        .v2-sort-select {
          font-size: 0.8rem;
          font-family: inherit;
          color: #4b473f;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-review {
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 40px;
          margin-bottom: 32px;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-hero-review-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          margin: 8px 0 4px;
        }

        .v2-hero-subtitle {
          font-size: 1rem;
          color: #8a8474;
          margin: 0 0 12px;
        }

        .v2-hero-pullquote {
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 1.3rem;
          line-height: 1.6;
          color: #4b473f;
          max-width: 60ch;
          margin: 16px 0 0;
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
          .v2-hero-review-title {
            font-size: 2rem;
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
      `}</style>
    </V2Layout>
  );
}
