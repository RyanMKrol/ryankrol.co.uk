import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';

export default function WorkoutDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchWorkoutDetails() {
      try {
        setLoading(true);

        // Fetch workout details
        const workoutResponse = await fetch(`/api/workouts/${id}`);
        if (!workoutResponse.ok) {
          throw new Error('Failed to fetch workout details');
        }

        const workoutData = await workoutResponse.json();
        setWorkout(workoutData);

        // Fetch workout exercises
        const exercisesResponse = await fetch(`/api/workouts/${id}/exercises`);
        if (!exercisesResponse.ok) {
          throw new Error('Failed to fetch workout exercises');
        }

        const exercisesData = await exercisesResponse.json();
        setExercises(exercisesData.exercises || []);

      } catch (err) {
        console.error('Error fetching workout details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkoutDetails();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const formatSetDisplay = (set) => {
    // Weight + reps (strength training)
    if (set.weight_kg && set.reps) {
      return `${set.weight_kg}kg × ${set.reps}`;
    }
    // Distance only (running, cycling, etc.)
    else if (set.distance_meters) {
      return `${(set.distance_meters / 1000).toFixed(2)}km`;
    }
    // Duration only (plank, etc.)
    else if (set.duration_seconds) {
      const minutes = Math.floor(set.duration_seconds / 60);
      const seconds = set.duration_seconds % 60;
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    // Distance + duration (cardio with both)
    else if (set.distance_meters && set.duration_seconds) {
      const minutes = Math.floor(set.duration_seconds / 60);
      const seconds = set.duration_seconds % 60;
      return `${(set.distance_meters / 1000).toFixed(2)}km in ${minutes}m ${seconds}s`;
    }
    // Reps only (bodyweight)
    else if (set.reps) {
      return `${set.reps} reps`;
    }
    // Fallback
    else {
      return 'completed';
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Workout Details - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <Header />
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading workout details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Workout Details - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <Header />
          <div className="loading-container">
            <p className="error-text">Error: {error}</p>
            <button
              onClick={() => router.back()}
              className="form-button"
              style={{ marginTop: '1rem' }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!workout) {
    return (
      <>
        <Head>
          <title>Workout Not Found - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <Header />
          <h1 className="page-title">Workout Not Found</h1>
          <p>The requested workout could not be found.</p>
          <button
            onClick={() => router.back()}
            className="form-button"
            style={{ marginTop: '1rem' }}
          >
            ← Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{workout.title || 'Workout'} - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.back()}
            className="btn-back"
          >
            ← Back
          </button>

          <h1 className="page-title">🏋️ {workout.title || 'Untitled Workout'}</h1>

          <div className="stat-panel" style={{ marginBottom: '2rem' }}>
            <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {formatDate(workout.start_time)}
            </div>
            <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              {formatTime(workout.start_time)} - {formatTime(workout.end_time)} • Duration: {getDuration(workout.start_time, workout.end_time)}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <div className="stat-label">EXERCISES</div>
                <div className="stat-value-small">{exercises.length}</div>
              </div>
              <div>
                <div className="stat-label">TOTAL VOLUME</div>
                <div className="stat-value-small">
                  {workout.totalVolume ? `${workout.totalVolume.toLocaleString()}kg` : '-'}
                </div>
              </div>
              <div>
                <div className="stat-label">WORKING SETS</div>
                <div className="stat-value-small">
                  {workout.totalWorkingSets || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            💪 Exercises
          </h2>

          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={exercise.exercise_id}
              className="workout-exercise-card"
            >
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Link
                    href={`/exercises/${encodeURIComponent(exercise.exercise_name)}`}
                    className="exercise-link"
                  >
                    {exercise.exercise_name}
                  </Link>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>📊</span>
                </h3>

                {exercise.sessionVolume > 0 && (
                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Session Volume: {exercise.sessionVolume}kg
                    {exercise.bestEstimated1RM > 0 && ` • Best 1RM: ${exercise.bestEstimated1RM}kg`}
                  </div>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {exercise.sets && exercise.sets.map((set, setIndex) => {
                  const isWarmup = set.type === 'warmup';
                  const warmupSets = exercise.sets.filter(s => s.type === 'warmup');
                  const workingSets = exercise.sets.filter(s => s.type !== 'warmup');

                  let setNumber, setLabel;
                  if (isWarmup) {
                    const warmupIndex = warmupSets.findIndex(s => s === set);
                    setNumber = warmupIndex + 1;
                    setLabel = `Warmup ${setNumber}`;
                  } else {
                    const workingIndex = workingSets.findIndex(s => s === set);
                    setNumber = workingIndex + 1;
                    setLabel = `Set ${setNumber}`;
                  }

                  return (
                    <div
                      key={setIndex}
                      className={`set-card ${isWarmup ? 'warmup' : ''}`}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {setLabel}
                      </div>
                      <div className="text-secondary">
                        {formatSetDisplay(set)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
