import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import V1Layout from '../../../components/v1/V1Layout';

export default function V1WorkoutDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchWorkout() {
      try {
        const workoutResponse = await fetch(`/api/workouts/${id}`);
        if (!workoutResponse.ok) throw new Error('Failed to fetch workout details');
        const workoutData = await workoutResponse.json();

        const exercisesResponse = await fetch(`/api/workouts/${id}/exercises`);
        if (!exercisesResponse.ok) throw new Error('Failed to fetch workout exercises');
        const exercisesData = await exercisesResponse.json();

        if (!cancelled) {
          setWorkout(workoutData);
          setExercises(exercisesData.exercises || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWorkout();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const breadcrumb = `~ / workouts / ${workout ? workout.title || 'untitled' : id || ''}`;

  return (
    <V1Layout breadcrumb={breadcrumb}>
      {loading && <p className="v1-status">Loading workout…</p>}
      {error && <p className="v1-status v1-status-error">Error: {error}</p>}

      {!loading && !error && !workout && <p className="v1-status">Workout not found.</p>}

      {!loading && !error && workout && (
        <>
          <div className="v1-info-table">
            <div className="v1-info-row">
              <span className="v1-info-label">Date</span>
              <span>{formatDate(workout.start_time)}</span>
            </div>
            <div className="v1-info-row">
              <span className="v1-info-label">Time</span>
              <span>
                {formatTime(workout.start_time)} – {formatTime(workout.end_time)}
              </span>
            </div>
            <div className="v1-info-row">
              <span className="v1-info-label">Duration</span>
              <span>{duration(workout.start_time, workout.end_time)}</span>
            </div>
            <div className="v1-info-row">
              <span className="v1-info-label">Exercises</span>
              <span className="v1-numeric">{exercises.length}</span>
            </div>
            <div className="v1-info-row">
              <span className="v1-info-label">Total Volume</span>
              <span className="v1-numeric">
                {workout.totalVolume ? `${workout.totalVolume.toLocaleString()}kg` : '—'}
              </span>
            </div>
            <div className="v1-info-row">
              <span className="v1-info-label">Working Sets</span>
              <span className="v1-numeric">{workout.totalWorkingSets || '—'}</span>
            </div>
          </div>

          <table className="v1-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th className="v1-numeric">Volume</th>
                <th className="v1-numeric">Best 1RM</th>
                <th>Sets</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise, i) => (
                <tr
                  key={exercise.exercise_id}
                  className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}
                >
                  <td>
                    <Link href={`/v1/exercises/${encodeURIComponent(exercise.exercise_name)}`}>
                      {exercise.exercise_name}
                    </Link>
                  </td>
                  <td className="v1-numeric">
                    {exercise.sessionVolume > 0 ? `${exercise.sessionVolume}kg` : '—'}
                  </td>
                  <td className="v1-numeric">
                    {exercise.bestEstimated1RM > 0 ? `${exercise.bestEstimated1RM}kg` : '—'}
                  </td>
                  <td>{(exercise.sets || []).map((set) => setDisplay(set)).join(' · ')}</td>
                </tr>
              ))}
              {exercises.length === 0 && (
                <tr>
                  <td colSpan={4} className="v1-status">
                    No exercises recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <style jsx>{`
        .v1-status {
          color: #6b7280;
          padding: 8px 0;
        }

        .v1-status-error {
          color: #f87171;
        }

        .v1-info-table {
          margin-bottom: 16px;
          max-width: 420px;
        }

        .v1-info-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #1c2022;
        }

        .v1-info-label {
          color: #6b7280;
        }

        .v1-numeric {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .v1-table {
          width: 100%;
          border-collapse: collapse;
        }

        .v1-table th,
        .v1-table td {
          text-align: left;
          padding: 6px 10px;
          border-bottom: 1px solid #1c2022;
        }

        .v1-table th {
          font-weight: 700;
          color: #6ee7b7;
        }

        .v1-row-even {
          background: #101314;
        }

        .v1-row-odd {
          background: #0d0f10;
        }
      `}</style>
    </V1Layout>
  );
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function duration(startTime, endTime) {
  if (!startTime || !endTime) return '—';
  const diffMins = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}

function setDisplay(set) {
  if (set.weight_kg && set.reps) return `${set.weight_kg}kg×${set.reps}`;
  if (set.distance_meters && set.duration_seconds) {
    return `${(set.distance_meters / 1000).toFixed(2)}km/${set.duration_seconds}s`;
  }
  if (set.distance_meters) return `${(set.distance_meters / 1000).toFixed(2)}km`;
  if (set.duration_seconds) return `${set.duration_seconds}s`;
  if (set.reps) return `${set.reps} reps`;
  return 'done';
}
