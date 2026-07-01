import { useEffect, useState } from 'react';
import V2Layout from '../../../components/v2/V2Layout';

export default function V2Listening() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTopAlbums() {
      try {
        const response = await fetch('/api/lastfm/top-albums?period=3month&limit=50');
        if (!response.ok) throw new Error('Failed to fetch top albums');
        const data = await response.json();
        if (!cancelled) setAlbums(data.albums || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTopAlbums();
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = albums;
  const maxPlaycount = albums.length > 0
    ? Math.max(...albums.map((a) => Number(a.playcount) || 0))
    : 1;

  return (
    <V2Layout>
      <div className="v2-list-header">
        <h1 className="v2-list-title">Listening</h1>
        <span className="v2-count">
          {albums.length > 0 ? `${albums.length} albums, last 3 months` : ''}
        </span>
      </div>

      {loading && <p className="v2-status">Loading listening history…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}

      {!loading && !error && albums.length === 0 && (
        <p className="v2-status">No albums found for the last 3 months.</p>
      )}

      {!loading && !error && featured && (
        <article className="v2-hero-album">
          <span className="v2-hero-kicker">On repeat</span>
          <h2 className="v2-hero-album-title">{featured.name}</h2>
          <p className="v2-hero-subtitle">by {featured.artist}</p>
          <p className="v2-hero-plays">
            {featured.playcount} play{featured.playcount !== 1 ? 's' : ''}
          </p>
        </article>
      )}

      {!loading && !error && rest.length > 0 && (
        <div className="v2-masonry">
          {rest.map((album, i) => {
            const barWidth = ((Number(album.playcount) || 0) / maxPlaycount) * 100;
            const card = (
              <article className="v2-album-card" data-tall={i % 3 === 0}>
                <span className="v2-album-rank">{i + 2}</span>
                <h3 className="v2-card-title">{album.name}</h3>
                <p className="v2-card-subtitle">{album.artist}</p>
                <p className="v2-plays">
                  {album.playcount} play{album.playcount !== 1 ? 's' : ''}
                </p>
                <div className="v2-bar-track">
                  <div className="v2-bar-fill" style={{ width: `${barWidth}%` }} />
                </div>
              </article>
            );
            return album.url ? (
              <a
                key={`${album.artist}-${album.name}`}
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                className="v2-album-link"
              >
                {card}
              </a>
            ) : (
              <div key={`${album.artist}-${album.name}`}>{card}</div>
            );
          })}
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

        .v2-hero-album {
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

        .v2-hero-album-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          margin: 8px 0 4px;
        }

        .v2-hero-subtitle {
          font-size: 1rem;
          color: #8a8474;
          margin: 0 0 8px;
        }

        .v2-hero-plays {
          font-size: 1.1rem;
          margin: 0;
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
          .v2-hero-album-title {
            font-size: 2rem;
          }
        }

        .v2-album-link {
          text-decoration: none;
          color: inherit;
          display: block;
          break-inside: avoid;
          margin-bottom: 20px;
        }

        .v2-album-card {
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 20px;
        }

        .v2-album-card[data-tall='true'] {
          padding-bottom: 32px;
        }

        .v2-album-rank {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 0.8rem;
          color: #b8b2a4;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.4rem;
          margin: 4px 0 4px;
        }

        .v2-card-subtitle {
          font-size: 0.85rem;
          color: #8a8474;
          margin: 0 0 8px;
        }

        .v2-plays {
          font-size: 0.85rem;
          margin: 0 0 8px;
        }

        .v2-bar-track {
          height: 4px;
          background: #efece2;
        }

        .v2-bar-fill {
          height: 100%;
          background: #211f1c;
        }
      `}</style>
    </V2Layout>
  );
}
