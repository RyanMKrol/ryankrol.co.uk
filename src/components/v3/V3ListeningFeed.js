import { useEffect, useState } from 'react';
import V3Layout from './V3Layout';
import V3TimelineEntry from './V3TimelineEntry';

export default function V3ListeningFeed() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopAlbums() {
      try {
        const response = await fetch('/api/lastfm/top-albums?period=3month&limit=50');
        if (!response.ok) throw new Error('Failed to fetch top albums');
        const data = await response.json();
        setAlbums(data.albums || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTopAlbums();
  }, []);

  return (
    <V3Layout title="listening">
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="v3-sort">sorted by playcount, highest first — change</p>

          {albums.map((album, index) => (
            <V3TimelineEntry
              key={`${album.artist}-${album.name}`}
              date={`#${index + 1}`}
              type="album"
              summary={`${album.name || 'Unknown Album'} — ${album.artist || 'Unknown Artist'}`}
            >
              {album.playcount} play{album.playcount !== 1 ? 's' : ''} in the last 3 months
              {album.url && (
                <>
                  {' '}·{' '}
                  <a href={album.url} target="_blank" rel="noopener noreferrer">
                    view on Last.fm
                  </a>
                </>
              )}
            </V3TimelineEntry>
          ))}

          {albums.length === 0 && <p className="v3-status">nothing here yet.</p>}

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

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
