import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import V2Layout from '../../../components/v2/V2Layout';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getDuration(startTime, endTime) {
  const diffMins = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}

function formatSetDisplay(set) {
  if (set.weight_kg && set.reps) return `${set.weight_kg}kg × ${set.reps}`;
  if (set.distance_meters && set.duration_seconds) {
    const minutes = Math.floor(set.duration_seconds / 60);
    const seconds = set.duration_seconds % 60;
    return `${(set.distance_meters / 1000).toFixed(2)}km in ${minutes}m ${seconds}s`;
  }
  if (set.distance_meters) return `${(set.distance_meters / 1000).toFixed(2)}km`;
  if (set.duration_seconds) {
    const minutes = Math.floor(set.duration_seconds / 60);
    const seconds = set.duration_seconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }
  if (set.reps) return `${set.reps} reps`;
  return 'completed';
}

function setLabelFor(set, sets) {
  const isWarmup = set.type === 'warmup';
  const warmupSets = sets.filter((s) => s.type === 'warmup');
  const workingSets = sets.filter((s) => s.type !== 'warmup');
  if (isWarmup) return `Warmup ${warmupSets.findIndex((s) => s === set) + 1}`;
  return `Set ${workingSets.findIndex((s) => s === set) + 1}`;
}

export default function V2WorkoutDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchWorkoutDetails() {
      try {
        setLoading(true);
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

    fetchWorkoutDetails();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <V2Layout>
      <div className="v2-article-shell">
        {loading && <p className="v2-status">Loading workout…</p>}
        {error && <p className="v2-status v2-error">Error: {error}</p>}
        {!loading && !error && !workout && <p className="v2-status">Workout not found.</p>}

        {!loading && !error && workout && (
          <>
            <span className="v2-hero-kicker">Session log</span>
            <h1 className="v2-article-headline">{workout.title || 'Untitled Workout'}</h1>
            <p className="v2-byline">
              {formatDate(workout.start_time)} — {formatTime(workout.start_time)} to{' '}
              {formatTime(workout.end_time)} ({getDuration(workout.start_time, workout.end_time)})
            </p>

            <div className="v2-stat-row">
              <div>
                <div className="v2-stat-label">Exercises</div>
                <div className="v2-stat-value">{exercises.length}</div>
              </div>
              <div>
                <div className="v2-stat-label">Total volume</div>
                <div className="v2-stat-value">
                  {workout.totalVolume ? `${workout.totalVolume.toLocaleString()}kg` : '—'}
                </div>
              </div>
              <div>
                <div className="v2-stat-label">Working sets</div>
                <div className="v2-stat-value">{workout.totalWorkingSets || '—'}</div>
              </div>
            </div>

            {exercises.map((exercise, i) => (
              <section key={exercise.exercise_id} className={`v2-exercise-section ${i === 0 ? 'v2-drop-cap' : ''}`}>
                <h2 className="v2-exercise-heading">
                  <Link href={`/v2/exercises/${encodeURIComponent(exercise.exercise_name)}`}>
                    {exercise.exercise_name}
                  </Link>
                </h2>
                {exercise.sessionVolume > 0 && (
                  <p className="v2-exercise-summary">
                    Session volume: {exercise.sessionVolume}kg
                    {exercise.bestEstimated1RM > 0 && ` — best estimated 1RM: ${exercise.bestEstimated1RM}kg`}
                  </p>
                )}
                <div className="v2-set-grid">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className={`v2-set-card ${set.type === 'warmup' ? 'v2-set-warmup' : ''}`}>
                      <div className="v2-set-label">{setLabelFor(set, exercise.sets)}</div>
                      <div className="v2-set-value">{formatSetDisplay(set)}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      <style jsx>{`
        .v2-article-shell {
          max-width: 680px;
          margin: 0 auto;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-article-headline {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.75rem;
          margin: 8px 0 8px;
          line-height: 1.1;
        }

        .v2-byline {
          font-size: 0.95rem;
          color: #8a8474;
          margin: 0 0 32px;
        }

        .v2-stat-row {
          display: flex;
          gap: 32px;
          border-top: 1px solid #d8d3c4;
          border-bottom: 1px solid #d8d3c4;
          padding: 16px 0;
          margin-bottom: 40px;
        }

        .v2-stat-label {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.75rem;
          color: #8a8474;
        }

        .v2-stat-value {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.5rem;
        }

        .v2-exercise-section {
          margin-bottom: 40px;
        }

        .v2-exercise-heading {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.6rem;
          margin: 0 0 4px;
        }

        .v2-exercise-heading :global(a) {
          color: #211f1c;
          text-decoration: none;
        }

        .v2-exercise-heading :global(a:hover) {
          text-decoration: underline;
        }

        .v2-exercise-summary {
          font-size: 0.9rem;
          color: #8a8474;
          margin: 0 0 16px;
        }

        .v2-drop-cap :global(p:first-of-type)::first-letter {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          float: left;
          line-height: 0.8;
          padding-right: 8px;
        }

        .v2-set-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
        }

        .v2-set-card {
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 10px 14px;
        }

        .v2-set-warmup {
          border-style: dashed;
          background: #fbf6ea;
        }

        .v2-set-label {
          font-size: 0.75rem;
          color: #8a8474;
        }

        .v2-set-value {
          font-size: 0.95rem;
          font-weight: 600;
        }
      `}</style>
    </V2Layout>
  );
}
