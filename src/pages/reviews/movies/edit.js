import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';

export default function EditMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columnCount = useResponsiveColumnCount(3, 900);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const data = await response.json();
        
        // Sort by date (most recent first)
        const sortedMovies = data.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB - dateA;
        });
        setMovies(sortedMovies);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movies...</p>
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
      <h1 className="page-title">edit movie reviews</h1>
      <Link href="/reviews/movies/backfill" className="backfill-link">
        Backfill metadata
      </Link>

      <MasonryColumns
        items={movies}
        columnCount={columnCount}
        className="poster-banner-grid"
        columnClassName="poster-banner-grid-col"
        renderItem={(movie) => (
          <div key={movie.id} className="review-card-with-edit">
            <ReviewCard
              item={movie}
              type="movie"
              isLast={false}
              styleVariant="poster-banner"
            />
            <Link
              href={`/reviews/movies/edit/${encodeURIComponent(movie.id)}`}
              className="edit-button-overlay edit-button-overlay--movies-banner"
            >
              Edit
            </Link>
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