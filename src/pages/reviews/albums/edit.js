import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';

export default function EditAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columnCount = useResponsiveColumnCount(2, 700);

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

      <MasonryColumns
        items={albums}
        columnCount={columnCount}
        className="square-cover-grid"
        columnClassName="square-cover-grid-col"
        renderItem={(album) => (
          <div key={album.id} className="review-edit-card">
            <div className="review-edit-header">
              <Link
                href={`/reviews/albums/edit/${encodeURIComponent(album.id)}`}
                className="review-edit-button"
              >
                Edit
              </Link>
            </div>
            <ReviewCard
              item={album}
              type="album"
              isLast={false}
              styleVariant="square-cover"
            />
          </div>
        )}
      />

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