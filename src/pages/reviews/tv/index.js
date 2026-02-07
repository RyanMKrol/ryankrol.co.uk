import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';

export default function TV() {
  const [tvShows, setTvShows] = useState([]);
  const [filteredTvShows, setFilteredTvShows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTvShows() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch TV shows');
        const data = await response.json();
        
        setTvShows(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTvShows();
  }, []);

  useEffect(() => {
    let filtered = tvShows.filter(tvShow => 
      tvShow.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered results
    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.replace(/^The\s+/i, '');
        const titleB = b.title.replace(/^The\s+/i, '');
        return titleA.localeCompare(titleB);
      });
    } else if (sortBy === 'title-desc') {
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.replace(/^The\s+/i, '');
        const titleB = b.title.replace(/^The\s+/i, '');
        return titleB.localeCompare(titleA);
      });
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'score-desc') {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'date-desc') {
      // Sort by date (oldest first)
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateA - dateB;
      });
    } else {
      // Sort by date (most recent first)
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }

    setFilteredTvShows(filtered);
  }, [searchTerm, tvShows, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading TV show reviews...</p>
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
      <Header />
      <h1 className="page-title">tv shows</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search TV shows by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="sort-container">
          <label className="sort-label">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Date (newest first)</option>
            <option value="date-desc">Date (oldest first)</option>
            <option value="title">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="score">Score (highest first)</option>
            <option value="score-desc">Score (lowest first)</option>
          </select>
        </div>
        {searchTerm && (
          <div className="search-results-count">
            Found {filteredTvShows.length} show{filteredTvShows.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="reviews-wrapper">
        {filteredTvShows.map((tvShow, index) => (
          <ReviewCard 
            key={`${tvShow.title}-${index}`}
            item={tvShow}
            type="tv"
            isLast={index === filteredTvShows.length - 1}
            styleVariant={2}
          />
        ))}
      </div>
    </div>
  );
}