import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import SortButtons from '../../../components/SortButtons';

const SORT_FIELDS = [
  { key: 'date',  label: 'Date',  defaultValue: 'date',  flippedValue: 'date-desc',  defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title', label: 'Title', defaultValue: 'title', flippedValue: 'title-desc', defaultArrow: '↑', flippedArrow: '↓' },
  { key: 'score', label: 'Score', defaultValue: 'score', flippedValue: 'score-desc', defaultArrow: '↓', flippedArrow: '↑' },
];

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const data = await response.json();
        
        setMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  useEffect(() => {
    let filtered = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredMovies(filtered);
  }, [searchTerm, movies, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movie reviews...</p>
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
      <h1 className="page-title">movies</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search movies by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <SortButtons fields={SORT_FIELDS} sortBy={sortBy} onChange={setSortBy} />
        {searchTerm && (
          <div className="search-results-count">
            Found {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="reviews-wrapper">
        {filteredMovies.map((movie, index) => (
          <ReviewCard 
            key={`${movie.title}-${index}`}
            item={movie}
            type="movie"
            isLast={index === filteredMovies.length - 1}
            styleVariant={2}
          />
        ))}
      </div>
    </div>
  );
}