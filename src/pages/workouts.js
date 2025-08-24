import { useState, useEffect } from 'react';
import Header from '../components/Header';
import WorkoutCard from '../components/WorkoutCard';

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageCount: 1,
    pageSize: 10
  });
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/workouts?page=${pagination.page}&pageSize=${pagination.pageSize}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch workouts');
        }
        
        const result = await response.json();
        
        setWorkouts(result.workouts || []);
        setPagination({
          page: result.page || 1,
          pageCount: result.page_count || 1,
          pageSize: pagination.pageSize
        });
        
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, [pagination.page]);

  useEffect(() => {
    // Apply push/pull/legs filter
    let filtered = workouts;
    if (activeFilter !== 'all') {
      filtered = workouts.filter(workout =>
        workout.title.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    setFilteredWorkouts(filtered);
  }, [workouts, activeFilter]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
          <p>We're working on connecting to the Hevy API. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🏋️ Workouts</h1>
      
      <div className="search-container">
        <div className="workout-filters">
          <span className="filter-label">Filter by type:</span>
          <div className="filter-buttons">
            <button
              onClick={() => setActiveFilter('all')}
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('push')}
              className={`filter-button ${activeFilter === 'push' ? 'active' : ''}`}
            >
              Push
            </button>
            <button
              onClick={() => setActiveFilter('pull')}
              className={`filter-button ${activeFilter === 'pull' ? 'active' : ''}`}
            >
              Pull
            </button>
            <button
              onClick={() => setActiveFilter('legs')}
              className={`filter-button ${activeFilter === 'legs' ? 'active' : ''}`}
            >
              Legs
            </button>
          </div>
        </div>

        {activeFilter !== 'all' && (
          <div className="search-results-count">
            Showing {filteredWorkouts.length} {activeFilter} workout{filteredWorkouts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="pagination-info">
        <p>Page {pagination.page} of {pagination.pageCount} ({workouts.length} workouts on this page)</p>
      </div>
      
      <div className="reviews-wrapper">
        {filteredWorkouts.length === 0 ? (
          <p>No workouts found matching your search.</p>
        ) : (
          filteredWorkouts.map((workout, index) => (
            <WorkoutCard 
              key={workout.id || index}
              workout={workout}
              isLast={index === filteredWorkouts.length - 1}
            />
          ))
        )}
      </div>

      {pagination.pageCount > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pageCount}
          </span>
          
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}