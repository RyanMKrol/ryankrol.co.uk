import Link from 'next/link';

export default function WorkoutCard({ workout, isLast = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
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

  const getTotalVolume = (exercises) => {
    let totalVolume = 0;
    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.type !== 'warmup' && set.weight_kg && set.reps) {
          totalVolume += set.weight_kg * set.reps;
        }
      });
    });
    return totalVolume;
  };

  const getTotalSets = (exercises) => {
    let totalSets = 0;
    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.type !== 'warmup') {
          totalSets += 1;
        }
      });
    });
    return totalSets;
  };

  const cardClass = `review-card workout-style-1 ${isLast ? '' : 'border-bottom'}`;

  return (
    <div className={cardClass}>
      <h3 className="review-title">
        {workout.title || 'Untitled Workout'}
      </h3>

      <div className="workout-meta">
        <p className="review-author">
          {formatDate(workout.start_time)} • {formatTime(workout.start_time)} - {formatTime(workout.end_time)}
        </p>

        <div className="workout-stats">
          <span className="workout-stat">
            <strong>Duration:</strong> {getDuration(workout.start_time, workout.end_time)}
          </span>
          <span className="workout-stat">
            <strong>Exercises:</strong> {workout.exercises.length}
          </span>
          <span className="workout-stat">
            <strong>Sets:</strong> {getTotalSets(workout.exercises)}
          </span>
          <span className="workout-stat">
            <strong>Volume:</strong> {getTotalVolume(workout.exercises).toLocaleString()}kg
          </span>
        </div>
      </div>

      <div className="workout-exercises">
        {workout.exercises.map((exercise, index) => (
          <div key={index} className="exercise-item">
            <h4 className="exercise-title">
              <Link
                href={`/exercises/${encodeURIComponent(exercise.title)}`}
                className="exercise-link"
              >
                {exercise.title}
                <span style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.7rem',
                  opacity: 0.7
                }}>
                  📊
                </span>
              </Link>
            </h4>
            <div className="exercise-sets">
              {exercise.sets.map((set, setIndex) => {
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

                // Format set display based on what data is available
                let setDisplay = setLabel + ': ';

                // Weight + reps (strength training)
                if (set.weight_kg && set.reps) {
                  setDisplay += `${set.weight_kg}kg × ${set.reps}`;
                }
                // Distance only (running, cycling, etc.)
                else if (set.distance_meters) {
                  setDisplay += `${(set.distance_meters / 1000).toFixed(2)}km`;
                }
                // Duration only (plank, etc.)
                else if (set.duration_seconds) {
                  const minutes = Math.floor(set.duration_seconds / 60);
                  const seconds = set.duration_seconds % 60;
                  if (minutes > 0) {
                    setDisplay += `${minutes}m ${seconds}s`;
                  } else {
                    setDisplay += `${seconds}s`;
                  }
                }
                // Distance + duration (cardio with both)
                else if (set.distance_meters && set.duration_seconds) {
                  const minutes = Math.floor(set.duration_seconds / 60);
                  const seconds = set.duration_seconds % 60;
                  setDisplay += `${(set.distance_meters / 1000).toFixed(2)}km in ${minutes}m ${seconds}s`;
                }
                // Reps only (bodyweight)
                else if (set.reps) {
                  setDisplay += `${set.reps} reps`;
                }
                // Fallback
                else {
                  setDisplay += 'completed';
                }

                return (
                  <span
                    key={setIndex}
                    className={`set-display ${isWarmup ? 'warmup' : ''}`}
                  >
                    {setDisplay}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
