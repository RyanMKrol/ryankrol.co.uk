import { useState, useEffect } from 'react';
import Variant6Hybrid from '../../../components/perfumeVariants/Variant6Hybrid';
import SearchInput from '../../../components/SearchInput';
import PillGroup from '../../../components/PillGroup';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';

const SORT_OPTIONS = [
  { value: 'date', label: 'date ↓' },
  { value: 'title', label: 'title' },
  { value: 'score', label: 'score' },
];

export default function Perfumes() {
  const [perfumes, setPerfumes] = useState([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const columnCount = useResponsiveColumnCount(2, 700);
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
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
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

      <div className="collection-review-header">
        <div className="collection-review-title-group">
          <h1 className="page-title">perfumes</h1>
          <p className="collection-review-meta">
            rated out of 10 · a new &amp; growing shelf
          </p>
        </div>

        <div className="collection-review-controls">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="search perfumes by title..."
          />
          <PillGroup
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      {searchTerm && (
        <div className="search-results-count">
          Found {filteredPerfumes.length} perfume{filteredPerfumes.length !== 1 ? 's' : ''}
        </div>
      )}

      <MasonryColumns
        items={filteredPerfumes}
        columnCount={columnCount}
        className="perfume-card-grid"
        columnClassName="perfume-card-grid-col"
        renderItem={(perfume, index) => (
          <Variant6Hybrid key={`${perfume.id}-${index}`} item={perfume} />
        )}
      />
    </div>
  );
}
