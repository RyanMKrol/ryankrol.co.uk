import { useEffect, useState } from 'react';
import Link from 'next/link';
import V3Layout from './V3Layout';

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

export default function V3WorkoutDetail({ workoutId }) {
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workoutId) return;

    async function fetchWorkoutDetails() {
      try {
        setLoading(true);
        const workoutResponse = await fetch(`/api/workouts/${workoutId}`);
        if (!workoutResponse.ok) throw new Error('Failed to fetch workout details');
        setWorkout(await workoutResponse.json());

        const exercisesResponse = await fetch(`/api/workouts/${workoutId}/exercises`);
        if (!exercisesResponse.ok) throw new Error('Failed to fetch workout exercises');
        const exercisesData = await exercisesResponse.json();
        setExercises(exercisesData.exercises || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkoutDetails();
  }, [workoutId]);

  return (
    <V3Layout title={workout?.title || 'workout'}>
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}
      {!loading && !error && !workout && <p className="v3-status">workout not found.</p>}

      {!loading && !error && workout && (
        <>
          <div className="v3-row">
            <div className="v3-gutter">summary</div>
            <div className="v3-body">
              <p>{workout.title || 'Untitled Workout'}</p>
              <p className="v3-muted">{formatDate(workout.start_time)}</p>
              <p className="v3-muted">
                {formatTime(workout.start_time)} – {formatTime(workout.end_time)} · duration{' '}
                {getDuration(workout.start_time, workout.end_time)}
              </p>
              <p className="v3-muted">
                {exercises.length} exercises · {workout.totalVolume ? `${workout.totalVolume.toLocaleString()}kg volume` : 'no volume'} ·{' '}
                {workout.totalWorkingSets || '-'} working sets
              </p>
            </div>
          </div>

          {exercises.map((exercise) => (
            <div className="v3-row" key={exercise.exercise_id}>
              <div className="v3-gutter">exercise</div>
              <div className="v3-body">
                <p>
                  <Link href={`/v3/exercises/${encodeURIComponent(exercise.exercise_name)}`}>
                    {exercise.exercise_name}
                  </Link>
                  {exercise.sessionVolume > 0 && (
                    <span className="v3-muted">
                      {' '}
                      — {exercise.sessionVolume}kg
                      {exercise.bestEstimated1RM > 0 && ` · best 1RM ${exercise.bestEstimated1RM}kg`}
                    </span>
                  )}
                </p>
                {exercise.sets && exercise.sets.map((set, setIndex) => (
                  <p className="v3-set" key={setIndex}>
                    {set.type === 'warmup' ? 'warmup' : 'set'} — {formatSetDisplay(set)}
                  </p>
                ))}
              </div>
            </div>
          ))}

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

        .v3-row {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #ececea;
        }

        .v3-gutter {
          flex: 0 0 84px;
          color: #767672;
        }

        .v3-body {
          flex: 1;
          min-width: 0;
        }

        .v3-body p {
          margin: 0 0 4px 0;
        }

        .v3-muted {
          color: #767672;
        }

        .v3-set {
          padding-left: 4px;
          font-size: 0.95em;
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
