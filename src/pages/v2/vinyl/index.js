import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import V2Layout from '../../../components/v2/V2Layout';

function sortingArtist(artist) {
  if (!artist) return '';
  return artist.replace(/^The\s+/i, '').trim();
}

export default function V2Vinyl() {
  const [vinyl, setVinyl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const sorted = useMemo(
    () =>
      [...vinyl].sort((a, b) => {
        const artistCompare = sortingArtist(a.artist).localeCompare(sortingArtist(b.artist));
        if (artistCompare !== 0) return artistCompare;
        return (a.title || '').localeCompare(b.title || '');
      }),
    [vinyl],
  );

  const [featured, ...rest] = sorted;

  return (
    <V2Layout>
      <div className="v2-list-header">
        <h1 className="v2-list-title">Vinyl</h1>
        <span className="v2-count">
          {sorted.length > 0 ? `${sorted.length} records` : ''}
        </span>
      </div>

      {loading && <p className="v2-status">Loading vinyl collection…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}

      {!loading && !error && sorted.length === 0 && (
        <p className="v2-status">No vinyl records yet.</p>
      )}

      {!loading && !error && featured && (
        <article className="v2-hero-vinyl">
          <span className="v2-hero-kicker">From the shelf</span>
          <h2 className="v2-hero-vinyl-title">{featured.title || 'Unknown Title'}</h2>
          <p className="v2-hero-subtitle">by {featured.artist || 'Unknown Artist'}</p>
          {featured.thumbnail && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={featured.thumbnail} alt={featured.title} className="v2-hero-cover" />
          )}
        </article>
      )}

      {!loading && !error && rest.length > 0 && (
        <div className="v2-masonry">
          {rest.map((record, i) => (
            <article key={`${record.artist}-${record.title}-${i}`} className="v2-vinyl-card">
              {record.thumbnail && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={record.thumbnail} alt={record.title} className="v2-card-cover" />
              )}
              <h3 className="v2-card-title">{record.title || 'Unknown Title'}</h3>
              <p className="v2-card-subtitle">{record.artist || 'Unknown Artist'}</p>
            </article>
          ))}
        </div>
      )}

      <p className="v2-add-link">
        <Link href="/v2/vinyl/add">+ Add a record</Link>
      </p>

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
        }

        .v2-count {
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-vinyl {
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

        .v2-hero-vinyl-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          margin: 8px 0 4px;
        }

        .v2-hero-subtitle {
          font-size: 1rem;
          color: #8a8474;
          margin: 0 0 16px;
        }

        .v2-hero-cover {
          max-width: 220px;
          height: auto;
          display: block;
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
          .v2-hero-vinyl-title {
            font-size: 2rem;
          }
        }

        .v2-vinyl-card {
          break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 20px;
        }

        .v2-card-cover {
          max-width: 100%;
          height: auto;
          display: block;
          margin-bottom: 12px;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.4rem;
          margin: 0 0 4px;
        }

        .v2-card-subtitle {
          font-size: 0.85rem;
          color: #8a8474;
          margin: 0;
        }

        .v2-add-link {
          margin-top: 32px;
          font-size: 0.9rem;
        }

        .v2-add-link :global(a) {
          color: #211f1c;
        }
      `}</style>
    </V2Layout>
  );
}
