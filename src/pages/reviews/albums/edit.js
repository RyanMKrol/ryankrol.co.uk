import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';

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
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <h1 className="page-title">edit album reviews</h1>
      <Link href="/reviews/albums/backfill" className="backfill-link">
        Backfill metadata
      </Link>

      <div className="square-cover-grid">
        {albums.map((album) => (
          <div key={album.id} className="review-card-with-edit review-card-with-edit--square-cover">
            <ReviewCard
              item={album}
              type="album"
              isLast={false}
              styleVariant="square-cover"
            />
            <Link
              href={`/reviews/albums/edit/${encodeURIComponent(album.id)}`}
              className="edit-button-overlay"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .backfill-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: var(--color-accent-secondary);
        }
      `}</style>
    </div>
  );
}