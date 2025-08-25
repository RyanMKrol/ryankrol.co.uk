/**
 * Shared workout metrics calculation functions
 * Used by both migration script and backfill service to ensure consistency
 */

/**
 * Calculate estimated 1RM using Epley formula
 * @param {number} weight - Weight in kg
 * @param {number} reps - Number of reps
 * @returns {number} Estimated 1RM
 */
export function calculateEstimated1RM(weight, reps) {
  // Using Epley formula: 1RM = weight * (1 + reps/30)
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate comprehensive metrics for a single exercise
 * @param {Object} exercise - Exercise data from Hevy API
 * @returns {Object} Exercise metrics
 */
export function calculateExerciseMetrics(exercise) {
  let sessionVolume = 0;
  let heaviestWeight = 0;
  let bestEstimated1RM = 0;
  let totalWorkingSets = 0;
  let totalWarmupSets = 0;
  let totalReps = 0;
  let workingSetVolume = 0;
  let totalDistance = 0;
  let totalDuration = 0;
  let hasWeightData = false;

  exercise.sets.forEach(set => {
    const weight = set.weight_kg !== null ? parseFloat(set.weight_kg) : 0;
    const reps = set.reps !== null ? parseInt(set.reps) : 0;
    const distance = set.distance_meters !== null ? parseFloat(set.distance_meters) : 0;
    const duration = set.duration_seconds !== null ? parseInt(set.duration_seconds) : 0;

    // Track if this exercise has any weight data
    if (set.weight_kg !== null && weight > 0) {
      hasWeightData = true;
    }

    // Calculate volume only for weight-based exercises
    const volume = (weight > 0 && reps > 0) ? weight * reps : 0;

    if (set.type === 'warmup') {
      totalWarmupSets++;
    } else {
      totalWorkingSets++;
      if (volume > 0) {
        workingSetVolume += volume;
        totalReps += reps;
        
        if (weight > heaviestWeight) {
          heaviestWeight = weight;
        }

        const estimated1RM = calculateEstimated1RM(weight, reps);
        if (estimated1RM > bestEstimated1RM) {
          bestEstimated1RM = estimated1RM;
        }
      }
    }

    sessionVolume += volume;
    totalDistance += distance;
    totalDuration += duration;
  });

  return {
    sessionVolume: sessionVolume > 0 ? Math.round(sessionVolume * 10) / 10 : 0,
    totalWorkingSets,
    totalWarmupSets,
    totalReps,
    totalWorkingReps: totalReps, // Working reps (same as totalReps since we only count working sets)
    workingSetVolume: workingSetVolume > 0 ? Math.round(workingSetVolume * 10) / 10 : 0,
    // Only include weight-based metrics if the exercise has weight data
    heaviestWeight: hasWeightData ? heaviestWeight : null,
    bestEstimated1RM: hasWeightData && bestEstimated1RM > 0 ? bestEstimated1RM : null,
    averageWeight: hasWeightData && totalReps > 0 ? Math.round((workingSetVolume / totalReps) * 10) / 10 : null,
    // Add cardio metrics
    totalDistance: totalDistance > 0 ? Math.round(totalDistance * 10) / 10 : null,
    totalDuration: totalDuration > 0 ? totalDuration : null,
    exerciseType: hasWeightData ? 'strength' : (totalDistance > 0 || totalDuration > 0) ? 'cardio' : 'bodyweight'
  };
}

/**
 * Calculate comprehensive metrics for an entire workout
 * @param {Object} workout - Workout data from Hevy API
 * @returns {Object} Workout metrics
 */
export function calculateWorkoutMetrics(workout) {
  let totalVolume = 0;
  let totalWorkingSets = 0;
  let totalWarmupSets = 0;
  let uniqueExercises = 0;
  let totalDistance = 0;
  let totalDuration = 0;
  let strengthExercises = 0;
  let cardioExercises = 0;

  workout.exercises.forEach(exercise => {
    uniqueExercises++;
    let hasWeight = false;
    let hasCardio = false;

    exercise.sets.forEach(set => {
      const weight = set.weight_kg !== null ? parseFloat(set.weight_kg) : 0;
      const reps = set.reps !== null ? parseInt(set.reps) : 0;
      const distance = set.distance_meters !== null ? parseFloat(set.distance_meters) : 0;
      const duration = set.duration_seconds !== null ? parseInt(set.duration_seconds) : 0;

      // Only add to volume if both weight and reps exist
      if (weight > 0 && reps > 0) {
        totalVolume += weight * reps;
        hasWeight = true;
      }

      if (distance > 0 || duration > 0) {
        hasCardio = true;
      }

      totalDistance += distance;
      totalDuration += duration;

      if (set.type === 'warmup') {
        totalWarmupSets++;
      } else {
        totalWorkingSets++;
      }
    });

    if (hasWeight) strengthExercises++;
    if (hasCardio) cardioExercises++;
  });

  const startTime = new Date(workout.start_time);
  const endTime = new Date(workout.end_time);
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  return {
    totalVolume: totalVolume > 0 ? Math.round(totalVolume * 10) / 10 : 0,
    totalWorkingSets,
    totalWarmupSets,
    uniqueExercises,
    strengthExercises,
    cardioExercises,
    totalDistance: totalDistance > 0 ? Math.round(totalDistance * 10) / 10 : null,
    totalDuration: totalDuration > 0 ? totalDuration : null,
    durationMinutes,
    workoutDate: startTime.toISOString().split('T')[0], // YYYY-MM-DD format
    workoutType: strengthExercises > 0 && cardioExercises > 0 ? 'mixed' : 
                 strengthExercises > 0 ? 'strength' : 
                 cardioExercises > 0 ? 'cardio' : 'bodyweight'
  };
}