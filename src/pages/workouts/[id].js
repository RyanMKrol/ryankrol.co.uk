import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Badge from '../../components/Badge';
import StatBlock from '../../components/StatBlock';

const SPLIT_COLORS = {
  push: 'var(--split-push)',
  pull: 'var(--split-pull)',
  legs: 'var(--split-legs)',
};

function splitForTitle(title) {
  const lower = (title || '').toLowerCase();
  return Object.keys(SPLIT_COLORS).find((key) => lower.includes(key));
}

function splitColorForTitle(title) {
  const split = splitForTitle(title);
  return split ? SPLIT_COLORS[split] : 'var(--color-ink-mute)';
}

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
    return date
      .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-');
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

        <Link href="/workouts" className="collection-back-link">
          ← back to workouts
        </Link>

        <div className="collection-review-title-group" style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            {workout.title || 'Untitled Workout'}
            <Badge accentColor={splitColorForTitle(workout.title)} variant="solid">
              {splitForTitle(workout.title) || 'workout'}
            </Badge>
          </h1>
        </div>

        <div className="workout-detail-stats">
          <StatBlock
            value={formatDate(workout.start_time)}
            label="date"
            accentColor="var(--accent-workouts)"
          />
          <StatBlock value={getDuration(workout.start_time, workout.end_time)} label="duration" />
          <StatBlock
            value={workout.totalVolume ? workout.totalVolume.toLocaleString() : '0'}
            unit="kg"
            label="volume"
          />
          <StatBlock value={exercises.length} label="exercises" />
        </div>

        <div className="workout-exercise-grid">
          {exercises.map((exercise) => (
            <div key={exercise.exercise_id} className="workout-exercise-card">
              <h3 className="workout-exercise-card-title">
                <Link
                  href={`/exercises/${encodeURIComponent(exercise.exercise_name)}`}
                  className="exercise-link"
                >
                  {exercise.exercise_name}
                </Link>
              </h3>

              <div className="workout-set-rows">
                {exercise.sets && exercise.sets.map((set, setIndex) => {
                  const isWarmup = set.type === 'warmup';
                  const warmupSets = exercise.sets.filter(s => s.type === 'warmup');
                  const workingSets = exercise.sets.filter(s => s.type !== 'warmup');

                  let setLabel;
                  if (isWarmup) {
                    const warmupIndex = warmupSets.findIndex(s => s === set);
                    setLabel = warmupSets.length > 1 ? `warmup ${warmupIndex + 1}` : 'warmup';
                  } else {
                    const workingIndex = workingSets.findIndex(s => s === set);
                    setLabel = `set ${workingIndex + 1}`;
                  }

                  const prBadges = [
                    set.isWeightPR && { key: 'weight', label: 'weight PR' },
                    set.is1RMPR && { key: '1rm', label: '1RM PR' },
                    set.isVolumePR && { key: 'volume', label: 'volume PR' },
                  ].filter(Boolean);

                  return (
                    <div
                      key={setIndex}
                      className={`workout-set-row ${isWarmup ? 'warmup' : ''}`}
                    >
                      <span className="workout-set-row-label">{setLabel}</span>
                      <span
                        className="workout-set-row-value"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {formatSetDisplay(set)}
                        {prBadges.map(({ key, label }) => (
                          <Badge
                            key={key}
                            accentColor="var(--accent-workouts)"
                            variant="soft"
                            mono={false}
                          >
                            <span aria-hidden="true">🏅</span>
                            <span
                              style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                padding: 0,
                                margin: '-1px',
                                overflow: 'hidden',
                                clip: 'rect(0, 0, 0, 0)',
                                whiteSpace: 'nowrap',
                                border: 0,
                              }}
                            >
                              {' '}{label}
                            </span>
                          </Badge>
                        ))}
                      </span>
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
