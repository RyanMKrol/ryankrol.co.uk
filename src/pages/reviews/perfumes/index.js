import { useState, useEffect } from 'react';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import SortButtons from '../../../components/SortButtons';

const SORT_FIELDS = [
  { key: 'date',  label: 'Date',  defaultValue: 'date',  flippedValue: 'date-desc',  defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title', label: 'Title', defaultValue: 'title', flippedValue: 'title-desc', defaultArrow: '↑', flippedArrow: '↓' },
  { key: 'score', label: 'Score', defaultValue: 'score', flippedValue: 'score-desc', defaultArrow: '↓', flippedArrow: '↑' },
];

export default function Perfumes() {
  const [perfumes, setPerfumes] = useState([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPerfumes() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const data = await response.json();

        setPerfumes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumes();
  }, []);

  useEffect(() => {
    let filtered = perfumes.filter(perfume =>
      perfume.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      filtered = filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'score-desc') {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'date-desc') {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateA - dateB;
      });
    } else {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }

    setFilteredPerfumes(filtered);
  }, [searchTerm, perfumes, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading perfume reviews...</p>
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
      <h1 className="page-title">perfumes</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search perfumes by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <SortButtons fields={SORT_FIELDS} sortBy={sortBy} onChange={setSortBy} />
        {searchTerm && (
          <div className="search-results-count">
            Found {filteredPerfumes.length} perfume{filteredPerfumes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="reviews-wrapper">
        {filteredPerfumes.map((perfume, index) => (
          <ReviewCard
            key={`${perfume.id}-${index}`}
            item={perfume}
            type="perfume"
            isLast={index === filteredPerfumes.length - 1}
            styleVariant={2}
          />
        ))}
      </div>
    </div>
  );
}
