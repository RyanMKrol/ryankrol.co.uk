import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import V2Layout from './V2Layout';
import { filterWorkouts, paginateWorkouts } from '../../lib/workoutPagination';

const PAGE_SIZE = 10;
const FILTERS = ['all', 'push', 'pull', 'legs'];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDuration(startTime, endTime) {
  const diffMins = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}

function getTotalVolume(exercises) {
  let total = 0;
  exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      if (set.type !== 'warmup' && set.weight_kg && set.reps) total += set.weight_kg * set.reps;
    });
  });
  return total;
}

export default function V2WorkoutList() {
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkouts() {
      try {
        const response = await fetch('/api/workouts?mode=all');
        if (!response.ok) throw new Error('Failed to fetch workouts');
        const result = await response.json();
        if (!cancelled) setAllWorkouts(result.workouts || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWorkouts();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => filterWorkouts(allWorkouts, activeFilter), [allWorkouts, activeFilter]);
  const { items: pageWorkouts, page, pageCount } = paginateWorkouts(filtered, currentPage, PAGE_SIZE);
  const [featured, ...rest] = pageWorkouts;

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  return (
    <V2Layout>
      <div className="v2-list-header">
        <h1 className="v2-list-title">Workouts</h1>
        <div className="v2-filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`v2-filter-button ${activeFilter === f ? 'active' : ''}`}
              onClick={() => handleFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="v2-status">Loading workouts…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="v2-status">No workouts found.</p>}

      {!loading && !error && featured && (
        <article className="v2-hero-review">
          <span className="v2-hero-kicker">Latest workout</span>
          <h2 className="v2-hero-review-title">{featured.title || 'Untitled Workout'}</h2>
          <p className="v2-hero-subtitle">
            {formatDate(featured.start_time)} — {getDuration(featured.start_time, featured.end_time)}
          </p>
          <div className="v2-hero-stats">
            <span>{featured.exercises.length} exercises</span>
            <span>{getTotalVolume(featured.exercises).toLocaleString()}kg volume</span>
          </div>
          <Link href={`/v2/workouts/${featured.id}`} className="v2-hero-link">
            Read the full session →
          </Link>
        </article>
      )}

      {!loading && !error && rest.length > 0 && (
        <div className="v2-masonry">
          {rest.map((workout) => (
            <article key={workout.id} className="v2-review-card">
              <h3 className="v2-card-title">
                <Link href={`/v2/workouts/${workout.id}`}>{workout.title || 'Untitled Workout'}</Link>
              </h3>
              <p className="v2-card-subtitle">
                {formatDate(workout.start_time)} — {getDuration(workout.start_time, workout.end_time)}
              </p>
              <p className="v2-card-excerpt">
                {workout.exercises.length} exercises · {getTotalVolume(workout.exercises).toLocaleString()}kg volume
              </p>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="v2-pagination">
          <button disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}>
            ← Previous
          </button>
          <span className="v2-pagination-label">
            Page {page} of {pageCount}
          </span>
          <button disabled={page >= pageCount} onClick={() => setCurrentPage(page + 1)}>
            Next →
          </button>
        </div>
      )}

      <style jsx>{`
        .v2-list-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .v2-list-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          margin: 0;
        }

        .v2-filter-row {
          display: flex;
          gap: 8px;
        }

        .v2-filter-button {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          background: transparent;
          border: 1px solid #c9c3b3;
          color: #4b473f;
          padding: 6px 14px;
          cursor: pointer;
        }

        .v2-filter-button.active {
          background: #211f1c;
          color: #faf8f3;
          border-color: #211f1c;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-review {
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 40px;
          margin-bottom: 32px;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-hero-review-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          margin: 8px 0 4px;
        }

        .v2-hero-subtitle {
          font-size: 1rem;
          color: #8a8474;
          margin: 0 0 12px;
        }

        .v2-hero-stats {
          display: flex;
          gap: 20px;
          font-size: 0.95rem;
          color: #4b473f;
          margin-bottom: 16px;
        }

        .v2-hero-link {
          font-size: 0.95rem;
          color: #211f1c;
          text-decoration: underline;
        }

        .v2-masonry {
          columns: 3;
          column-gap: 20px;
        }

        @media (max-width: 900px) {
          .v2-masonry {
            columns: 2;
          }
        }

        @media (max-width: 600px) {
          .v2-masonry {
            columns: 1;
          }
          .v2-hero-review-title {
            font-size: 2rem;
          }
        }

        .v2-review-card {
          break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 20px;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.4rem;
          margin: 0 0 4px;
        }

        .v2-card-title :global(a) {
          color: #211f1c;
          text-decoration: none;
        }

        .v2-card-title :global(a:hover) {
          text-decoration: underline;
        }

        .v2-card-subtitle {
          font-size: 0.85rem;
          color: #8a8474;
          margin: 0 0 8px;
        }

        .v2-card-excerpt {
          font-size: 0.95rem;
          line-height: 1.55;
          color: #4b473f;
          margin: 10px 0 0;
        }

        .v2-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 40px;
        }

        .v2-pagination button {
          background: transparent;
          border: 1px solid #c9c3b3;
          padding: 8px 16px;
          cursor: pointer;
          font-family: inherit;
        }

        .v2-pagination button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .v2-pagination-label {
          font-size: 0.9rem;
          color: #4b473f;
        }
      `}</style>
    </V2Layout>
  );
}
