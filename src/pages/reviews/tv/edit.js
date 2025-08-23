import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

export default function EditTVShows() {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTvShows() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch TV shows');
        const data = await response.json();
        
        // Sort by date (most recent first)
        const sortedTvShows = data.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB - dateA;
        });
        setTvShows(sortedTvShows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTvShows();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading TV shows...</p>
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
      <h1 className="page-title">📺 Edit TV Show Reviews</h1>
      
      <div className="edit-list">
        {tvShows.map((tvShow, index) => (
          <div key={`${tvShow.title}-${index}`} className="edit-item">
            <div className="edit-item-content">
              <h3 className="edit-item-title">{tvShow.title}</h3>
              <p className="edit-item-rating">Rating: {tvShow.overallScore}/5</p>
              <p className="edit-item-date">{tvShow.date}</p>
            </div>
            <Link 
              href={`/reviews/tv/edit/${encodeURIComponent(tvShow.title)}`}
              className="edit-button"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}