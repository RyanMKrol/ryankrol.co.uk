import { useEffect, useState } from 'react';
import V3Layout from './V3Layout';
import V3TimelineEntry from './V3TimelineEntry';

function sortingArtist(artist) {
  if (!artist) return '';
  return artist.replace(/^The\s+/i, '').trim();
}

export default function V3VinylFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVinyl() {
      try {
        const response = await fetch('/api/vinyl');
        if (!response.ok) throw new Error('Failed to fetch vinyl collection');
        const data = await response.json();
        setItems(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVinyl();
  }, []);

  const sorted = [...items].sort((a, b) => {
    const artistCompare = sortingArtist(a.artist).localeCompare(sortingArtist(b.artist));
    if (artistCompare !== 0) return artistCompare;
    return (a.title || '').localeCompare(b.title || '');
  });

  return (
    <V3Layout title="vinyl">
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="v3-sort">sorted by artist, A–Z</p>

          {sorted.map((record) => (
            <V3TimelineEntry
              key={`${record.artist}-${record.title}`}
              date={sortingArtist(record.artist).charAt(0).toUpperCase() || '#'}
              type="vinyl"
              summary={`${record.title || 'Unknown Title'} — ${record.artist || 'Unknown Artist'}`}
            >
              {record.lastfm?.summary || 'No notes yet.'}
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

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
