import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';

export default function EditAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const data = await response.json();
        
        // Sort by date (most recent first)
        const sortedAlbums = data.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB - dateA;
        });
        setAlbums(sortedAlbums);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🎵 Edit Album Reviews</h1>
      
      <div className="reviews-wrapper">
        {albums.map((album, index) => (
          <div key={`${album.title}-${album.artist}-${index}`} className="review-card-with-edit">
            <ReviewCard 
              item={album}
              type="album"
              isLast={false}
              styleVariant={2}
            />
            <Link 
              href={`/reviews/albums/edit/${encodeURIComponent(album.title + '|' + album.artist)}`}
              className="edit-button-overlay"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}