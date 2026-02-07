import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo';
import { DYNAMO_TABLES } from './constants';
import { clearApiCache } from './apiCache';
import { calculateExerciseMetrics, calculateWorkoutMetrics } from './workoutMetrics.js';

// Rate limiting helper - 150ms between calls to be extra safe
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Metric calculation functions moved to shared library: ./workoutMetrics.js

/**
 * Store workout and exercises in DynamoDB
 */
async function storeWorkoutInDynamoDB(workout) {
  const metrics = calculateWorkoutMetrics(workout);

  const workoutItem = {
    id: workout.id,
    title: workout.title || 'Untitled Workout',
    start_time: workout.start_time,
    end_time: workout.end_time,
    exercises: workout.exercises,
    ...metrics,
    created_at: new Date().toISOString(),
    data_source: 'hevy_api',
    backfilled_at: new Date().toISOString()
  };

  // Store workout
  const workoutParams = {
    TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
    Item: workoutItem,
    ConditionExpression: 'attribute_not_exists(id)'
  };

  try {
    console.log(`🗄️  [BACKFILL] Storing workout: ${workout.title} (${workout.id})`);
    const workoutStartTime = Date.now();
    await docClient.send(new PutCommand(workoutParams));
    const workoutStoreTime = Date.now() - workoutStartTime;

    console.log(`✅ [BACKFILL] Stored workout in ${workoutStoreTime}ms: ${workout.title}`);

    // Store exercises
    console.log(`🗄️  [BACKFILL] Storing ${workout.exercises.length} exercises for workout ${workout.id}`);

    for (let j = 0; j < workout.exercises.length; j++) {
      const exercise = workout.exercises[j];
      const exerciseMetrics = calculateExerciseMetrics(exercise);
      const workoutDate = new Date(workout.start_time).toISOString().split('T')[0];

      const exerciseItem = {
        exercise_id: `${workout.id}_${j}`,
        workout_id: workout.id,
        exercise_name: exercise.title,
        workout_date: workoutDate,
        workout_title: workout.title || 'Untitled Workout',
        start_time: workout.start_time,
        end_time: workout.end_time,
        sets: exercise.sets,
        exercise_index: j,
        ...exerciseMetrics,
        created_at: new Date().toISOString(),
        data_source: 'hevy_api',
        backfilled_at: new Date().toISOString()
      };

      const exerciseParams = {
        TableName: DYNAMO_TABLES.EXERCISES_TABLE,
        Item: exerciseItem,
        ConditionExpression: 'attribute_not_exists(exercise_id)'
      };

      const exerciseStartTime = Date.now();
      await docClient.send(new PutCommand(exerciseParams));
      const exerciseStoreTime = Date.now() - exerciseStartTime;

      console.log(`   📝 [BACKFILL] Stored exercise ${j + 1}/${workout.exercises.length}: ${exercise.title} (${exerciseStoreTime}ms)`);
    }

    console.log(`✅ [BACKFILL] Successfully stored workout and all exercises for ${workout.id}`);
    return true;

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`⚠️  [BACKFILL] Workout ${workout.id} already exists, skipping`);
      return false; // Signal that workout was not stored (already exists)
    } else {
      console.error(`❌ [BACKFILL] Error storing workout ${workout.id}:`, error);
      throw error;
    }
  }
}

/**
 * Backfill missing workouts from Hevy API
 * @returns {Object} Backfill results
 */
export async function backfillWorkouts() {
  const HEVY_API_KEY = process.env.HEVY_API_KEY;

  if (!HEVY_API_KEY) {
    console.log('⚠️  HEVY_API_KEY not found, skipping backfill');
    return { newWorkouts: 0, error: 'Missing HEVY_API_KEY' };
  }

  console.log('🚀 [BACKFILL] Starting workout backfill from Hevy API...');

  try {
    const backfillStartTime = Date.now();
    const CONSECUTIVE_EXISTING_THRESHOLD = 10;

    let newWorkouts = 0;
    let consecutiveExisting = 0;
    let page = 1;
    let shouldContinue = true;
    let totalApiCalls = 0;

    while (shouldContinue) {
      console.log(`📡 [BACKFILL] Fetching page ${page} from Hevy API...`);
      totalApiCalls++;

      try {
        const response = await fetch(
          `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=10`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'api-key': HEVY_API_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Hevy API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.workouts || data.workouts.length === 0) {
          console.log('📭 No more workouts to process');
          break;
        }

        console.log(`📝 [BACKFILL] Processing ${data.workouts.length} workouts from page ${page}`);

        // Process workouts newest-first
        for (const workout of data.workouts) {
          const workoutDate = new Date(workout.start_time).toISOString().split('T')[0];
          console.log(`📅 [BACKFILL] Processing workout from ${workoutDate}: ${workout.title} (${workout.id})`);

          const stored = await storeWorkoutInDynamoDB(workout);
          if (stored) {
            newWorkouts++;
            consecutiveExisting = 0;
            console.log(`📊 [BACKFILL] Progress: ${newWorkouts} new workouts stored`);
          } else {
            consecutiveExisting++;
            console.log(`⏭️  [BACKFILL] Consecutive existing: ${consecutiveExisting}/${CONSECUTIVE_EXISTING_THRESHOLD}`);

            if (consecutiveExisting >= CONSECUTIVE_EXISTING_THRESHOLD) {
              console.log(`🛑 [BACKFILL] Hit ${CONSECUTIVE_EXISTING_THRESHOLD} consecutive existing workouts, stopping backfill`);
              shouldContinue = false;
              break;
            }
          }

          // Rate limiting
          console.log(`⏱️  [BACKFILL] Rate limiting: waiting 150ms...`);
          await sleep(150);
        }

        // Check if we've processed all pages
        if (data.page >= data.page_count) {
          console.log('📄 Reached last page');
          break;
        }

        page++;

        // Rate limiting between pages
        await sleep(150);

      } catch (error) {
        console.error(`❌ Error processing page ${page}:`, error);
        break;
      }
    }

    const backfillTotalTime = Date.now() - backfillStartTime;
    console.log(`🎉 [BACKFILL] Backfill complete! Added ${newWorkouts} new workouts in ${backfillTotalTime}ms`);
    console.log(`📊 [BACKFILL] Summary: ${totalApiCalls} API calls, ${newWorkouts} new workouts stored`);

    // Bust all workout-related caches
    if (newWorkouts > 0) {
      console.log('🗑️  [BACKFILL] New workouts found, clearing workout caches...');
      clearApiCache('api-workouts-dynamo*');
      clearApiCache('api-workout-stats');
      clearApiCache('api-workout*');
      clearApiCache('api-exercise*');
      console.log('✅ [BACKFILL] Cache cleared for all workout-related endpoints');
    } else {
      console.log('ℹ️  [BACKFILL] No new workouts found, keeping existing cache');
    }

    return {
      newWorkouts,
      cacheCleared: newWorkouts > 0,
      totalApiCalls,
      backfillTimeMs: backfillTotalTime
    };

  } catch (error) {
    console.error('❌ [BACKFILL] Backfill failed:', error);
    return {
      newWorkouts: 0,
      error: error.message
    };
  }
}

/**
 * Trigger backfill in the background (fire-and-forget)
 * This doesn't block the API response
 */
export function triggerBackfillAsync() {
  // Use setImmediate to run on next tick without blocking
  setImmediate(async () => {
    try {
      console.log('🚀 [BACKFILL] Background backfill triggered by cache miss');
      const result = await backfillWorkouts();
      console.log('✅ [BACKFILL] Background backfill completed:', result);
    } catch (error) {
      console.error('❌ [BACKFILL] Background backfill error:', error);
    }
  });

  console.log('🚀 [BACKFILL] Triggered background backfill (non-blocking)');
}
