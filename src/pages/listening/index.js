import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';

export default function ListeningPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopAlbums() {
      try {
        const response = await fetch('/api/lastfm/top-albums?period=3month&limit=50');
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.albums || []);
        } else {
          setError('Failed to fetch top albums');
        }
      } catch (err) {
        setError('Error fetching top albums');
      } finally {
        setLoading(false);
      }
    }

    fetchTopAlbums();
  }, []);

  const maxPlaycount = albums.length > 0
    ? Math.max(...albums.map(a => Number(a.playcount) || 0))
    : 1;

  return (
    <>
      <Head>
        <title>My Listening History - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <h1 className="page-title">listening</h1>

        <p className="page-subtitle">
          My most played albums from the last 3 months, via Last.fm
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        )}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {!loading && !error && albums.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No albums found for the last month.
          </div>
        )}

        {!loading && !error && albums.length > 0 && (
          <div style={{ display: 'grid', gap: '0' }}>
            {albums.map((album, index) => {
              const barWidth = ((Number(album.playcount) || 0) / maxPlaycount) * 100;
              return (
                <div
                  key={`${album.artist}-${album.name}`}
                  className="listening-item-wrapper"
                >
                  <div className="listening-item">
                    <div className={`text-muted listening-rank${index < 3 ? ' top-3' : ''}`} style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      minWidth: '2rem',
                      textAlign: 'right'
                    }}>
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      {album.url ? (
                        <a
                          href={album.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'block'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            {album.name}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                            by {album.artist}
                          </div>
                        </a>
                      ) : (
                        <>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            {album.name}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                            by {album.artist}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-muted" style={{
                      fontSize: '0.9rem',
                      textAlign: 'right'
                    }}>
                      {album.playcount} play{album.playcount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div
                    className="popularity-bar"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
