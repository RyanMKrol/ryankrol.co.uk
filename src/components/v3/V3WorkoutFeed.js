import { useEffect, useState } from 'react';
import Link from 'next/link';
import V3Layout from './V3Layout';
import V3TimelineEntry from './V3TimelineEntry';
import { filterWorkouts } from '../../lib/workoutPagination';

const FILTERS = ['all', 'push', 'pull', 'legs'];

function formatGutterDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function V3WorkoutFeed() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const response = await fetch('/api/workouts?mode=all');
        if (!response.ok) throw new Error('Failed to fetch workouts');
        const data = await response.json();
        setWorkouts(data.workouts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, []);

  const filtered = filterWorkouts(workouts, filter);

  return (
    <V3Layout title="workouts">
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="v3-sort">
            filtered by{' '}
            {FILTERS.map((f, i) => (
              <span key={f}>
                <button
                  type="button"
                  className={`v3-filter-link ${filter === f ? 'v3-filter-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
                {i < FILTERS.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>

          {filtered.map((workout) => (
            <V3TimelineEntry
              key={workout.id}
              date={formatGutterDate(workout.start_time)}
              type="workout"
              summary={`${workout.title || 'Untitled Workout'}${workout.totalVolume ? ` — ${workout.totalVolume.toLocaleString()}kg` : ''}`}
            >
              <p>Working sets: {workout.totalWorkingSets || '-'}</p>
              <p>
                <Link href={`/v3/workouts/${workout.id}`}>View full workout →</Link>
              </p>
            </V3TimelineEntry>
          ))}

          {filtered.length === 0 && <p className="v3-status">nothing here yet.</p>}

          <div className="v3-end">— end of feed —</div>
        </>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }

        .v3-sort {
          color: #767672;
          margin: 14px 0;
        }

        .v3-filter-link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: #767672;
          text-decoration: underline;
          cursor: pointer;
        }

        .v3-filter-active {
          color: #1a1a1a;
          font-weight: 600;
          text-decoration: none;
        }

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
