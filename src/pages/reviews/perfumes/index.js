import { useState, useEffect } from 'react';
import Variant6Hybrid from '../../../components/perfumeVariants/Variant6Hybrid';
import SearchInput from '../../../components/SearchInput';
import PillGroup from '../../../components/PillGroup';
import SortButtons from '../../../components/SortButtons';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';
import { OWNERSHIP_OPTIONS } from '../../../components/PerfumeCharacteristics';

const SORT_FIELDS = [
  { key: 'date', label: 'date', defaultValue: 'date', flippedValue: 'date-asc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title', label: 'title', defaultValue: 'title', flippedValue: 'title-desc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'score', label: 'score', defaultValue: 'score', flippedValue: 'score-asc', defaultArrow: '↓', flippedArrow: '↑' },
];

const OWNERSHIP_FILTER_OPTIONS = [
  { value: 'all', label: 'all' },
  ...OWNERSHIP_OPTIONS.map(o => ({ value: o.value, label: o.label })),
];

export default function Perfumes() {
  const [perfumes, setPerfumes] = useState([]);
  const [filteredPerfumes, setFilteredPerfumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
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
      (perfume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (perfume.designer || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (ownershipFilter === 'all' || perfume.ownership === ownershipFilter)
    );

    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      filtered = filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'score-asc') {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'date-asc') {
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
  }, [searchTerm, perfumes, sortBy, ownershipFilter]);

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
            placeholder="search by title or designer..."
          />
          <SortButtons
            fields={SORT_FIELDS}
            sortBy={sortBy}
            onChange={setSortBy}
          />
          <PillGroup
            options={OWNERSHIP_FILTER_OPTIONS}
            value={ownershipFilter}
            onChange={setOwnershipFilter}
            accentColor="var(--accent-perfumes)"
          />
        </div>
      </div>

      {(searchTerm || ownershipFilter !== 'all') && (
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
