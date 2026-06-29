import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import WorkoutCard from '../../components/WorkoutCard';
import { filterWorkouts, paginateWorkouts } from '../../lib/workoutPagination';

const PAGE_SIZE = 10;

export default function Workouts() {
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true);
        const response = await fetch('/api/workouts?mode=all');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch workouts');
        }
        const result = await response.json();
        setAllWorkouts(result.workouts || []);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkouts();
  }, []);

  const filtered = filterWorkouts(allWorkouts, activeFilter);
  const { items: pageWorkouts, page, pageCount } = paginateWorkouts(filtered, currentPage, PAGE_SIZE);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // always reset to page 1 on filter change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading workouts...</p>
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
          <p>We&apos;re working on connecting to the Hevy API. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">workouts</h1>

      <div style={{ marginBottom: '1rem' }}>
        <Link href="/programmes" style={{ fontSize: '0.9rem' }}>
          View programme stats →
        </Link>
      </div>

      <div className="search-container">
        <div className="workout-filters">
          <span className="filter-label">Filter by type:</span>
          <div className="filter-buttons">
            {['all', 'push', 'pull', 'legs'].map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`filter-button ${activeFilter === f ? 'active' : ''}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeFilter !== 'all' && (
          <div className="search-results-count">
            Showing {filtered.length} {activeFilter} workout{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="pagination-info">
        <p>Page {page} of {pageCount} ({filtered.length} workout{filtered.length !== 1 ? 's' : ''})</p>
      </div>

      <div className="reviews-wrapper">
        {pageWorkouts.length === 0 ? (
          <p>No workouts found matching your search.</p>
        ) : (
          pageWorkouts.map((workout, index) => (
            <WorkoutCard
              key={workout.id || index}
              workout={workout}
              isLast={index === pageWorkouts.length - 1}
            />
          ))
        )}
      </div>

      {pageCount > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="pagination-button"
          >
            ← Previous
          </button>

          <div className="pagination-pages">
            {(() => {
              const pages = [];
              const startPage = Math.max(1, page - 3);
              const endPage = Math.min(pageCount, page + 3);

              if (page > 4) {
                pages.push(
                  <button key={1} onClick={() => handlePageChange(1)} className="pagination-page">1</button>
                );
                if (page > 5) {
                  pages.push(<span key="start-ellipsis" className="pagination-ellipsis">...</span>);
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination-page ${i === page ? 'active' : ''}`}
                  >
                    {i}
                  </button>
                );
              }

              if (page < pageCount - 3) {
                if (page < pageCount - 4) {
                  pages.push(<span key="end-ellipsis" className="pagination-ellipsis">...</span>);
                }
                pages.push(
                  <button key={pageCount} onClick={() => handlePageChange(pageCount)} className="pagination-page">
                    {pageCount}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pageCount}
            className="pagination-button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
