import { useState, useEffect } from 'react';
import Head from 'next/head';
import { assignGradients } from '../../components/CoverTile';

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

  const gradientKeys = albums
    .filter((album) => !album.image)
    .map((album) => `${album.artist}-${album.name}`);
  const gradients = assignGradients(gradientKeys);
  let gradientIndex = 0;
  const albumGradients = albums.map((album) => (album.image ? null : gradients[gradientIndex++]));

  return (
    <>
      <Head>
        <title>My Listening History - ryankrol.co.uk</title>
      </Head>

      <div className="container">

        <div className="collection-review-header">
          <div className="collection-review-title-group">
            <h1 className="page-title">listening</h1>
            <p className="collection-review-meta">
              top 50 albums · last 90 days · via last.fm
            </p>
          </div>
        </div>

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
          <div className="listening-ranked-list">
            {albums.map((album, index) => {
              const barWidth = ((Number(album.playcount) || 0) / maxPlaycount) * 100;
              const isTop = index === 0;
              const content = (
                <>
                  <div className="listening-rank">{index + 1}</div>

                  <div
                    className="listening-cover-thumb"
                    style={!album.image ? { background: albumGradients[index] } : undefined}
                  >
                    {album.image && (
                      <img src={album.image} alt="" />
                    )}
                  </div>

                  <div className="listening-row-info">
                    <div className="listening-row-title">{album.name}</div>
                    <div className="listening-row-artist">{album.artist}</div>
                  </div>

                  <div className="listening-bar-track">
                    <div className="listening-bar-fill" style={{ width: `${barWidth}%` }} />
                  </div>

                  <div className="listening-playcount">{album.playcount}</div>
                </>
              );

              const rowClassName = `listening-row${isTop ? ' listening-row-top' : ''}`;

              return album.url ? (
                <a
                  key={`${album.artist}-${album.name}`}
                  href={album.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClassName}
                >
                  {content}
                </a>
              ) : (
                <div
                  key={`${album.artist}-${album.name}`}
                  className={rowClassName}
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
