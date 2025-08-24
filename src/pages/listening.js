import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';

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

  return (
    <>
      <Head>
        <title>What I've Been Listening To - ryankrol.co.uk</title>
      </Head>
      
      <div className="container">
        <Header />
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          What I've Been Listening To
        </h1>
        
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
          My most played albums from the last 3 months, via Last.fm
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && albums.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No albums found for the last month.
          </div>
        )}

        {!loading && !error && albums.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {albums.map((album, index) => (
              <div 
                key={`${album.artist}-${album.name}`}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold', 
                  color: '#666',
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
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        by {album.artist}
                      </div>
                    </a>
                  ) : (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {album.name}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        by {album.artist}
                      </div>
                    </>
                  )}
                </div>
                
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#666',
                  textAlign: 'right'
                }}>
                  {album.playcount} play{album.playcount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}