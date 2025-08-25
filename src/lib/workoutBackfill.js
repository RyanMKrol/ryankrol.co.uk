import AWS from 'aws-sdk';
import { DYNAMO_TABLES } from './constants';
import { clearApiCache } from './apiCache';
import { calculateExerciseMetrics, calculateWorkoutMetrics } from './workoutMetrics.js';

const CREDENTIALS = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const DYNAMO_REGION = 'us-east-2';

AWS.config.update({
  region: DYNAMO_REGION,
  credentials: CREDENTIALS
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Rate limiting helper - 150ms between calls to be extra safe
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the most recent workout date from DynamoDB
 * @returns {string|null} Most recent workout date in YYYY-MM-DD format, or null if no workouts
 */
async function getMostRecentWorkoutDate() {
  try {
    console.log('🗄️  [BACKFILL] Scanning DynamoDB to find most recent workout date');
    
    const params = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      ProjectionExpression: 'start_time, workoutDate',
    };

    const startTime = Date.now();
    const result = await dynamodb.scan(params).promise();
    const workouts = result.Items || [];
    const queryTime = Date.now() - startTime;

    console.log(`🗄️  [BACKFILL] Found ${workouts.length} existing workouts in ${queryTime}ms`);

    if (workouts.length === 0) {
      console.log('📭 [BACKFILL] No existing workouts found - will backfill everything');
      return null;
    }

    // Sort by start_time descending to get most recent
    workouts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    const mostRecentDate = workouts[0].workoutDate;
    
    console.log(`📅 [BACKFILL] Most recent workout in DynamoDB: ${mostRecentDate}`);
    return mostRecentDate;

  } catch (error) {
    console.error('❌ [BACKFILL] Error getting most recent workout date:', error);
    return null;
  }
}

/**
 * Check if a workout already exists in DynamoDB
 * @param {string} workoutId - The workout ID to check
 * @returns {boolean} True if workout exists
 */
async function workoutExists(workoutId) {
  try {
    const params = {
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      Key: { id: workoutId },
      ProjectionExpression: 'id'
    };

    const result = await dynamodb.get(params).promise();
    const exists = !!result.Item;
    
    if (exists) {
      console.log(`✅ [BACKFILL] Workout ${workoutId} already exists in DynamoDB`);
    }
    
    return exists;

  } catch (error) {
    console.error(`❌ [BACKFILL] Error checking if workout ${workoutId} exists:`, error);
    return false;
  }
}

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
    await dynamodb.put(workoutParams).promise();
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
      await dynamodb.put(exerciseParams).promise();
      const exerciseStoreTime = Date.now() - exerciseStartTime;
      
      console.log(`   📝 [BACKFILL] Stored exercise ${j + 1}/${workout.exercises.length}: ${exercise.title} (${exerciseStoreTime}ms)`);
    }

    console.log(`✅ [BACKFILL] Successfully stored workout and all exercises for ${workout.id}`);
    return true;
    
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      console.log(`⚠️  [BACKFILL] Workout ${workout.id} already exists, stopping backfill`);
      return false; // Signal to stop backfill
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
    const mostRecentDate = await getMostRecentWorkoutDate();

    let newWorkouts = 0;
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

        // Process workouts in chronological order (newest first)
        for (const workout of data.workouts) {
          const workoutDate = new Date(workout.start_time).toISOString().split('T')[0];
          console.log(`📅 [BACKFILL] Processing workout from ${workoutDate}: ${workout.title} (${workout.id})`);
          
          // If this workout is older than our most recent, we've caught up
          if (mostRecentDate && workoutDate <= mostRecentDate) {
            console.log(`⏰ [BACKFILL] Workout date ${workoutDate} is <= most recent ${mostRecentDate}, checking if exists...`);
            
            // Double-check by seeing if it exists
            const exists = await workoutExists(workout.id);
            if (exists) {
              console.log(`🛑 [BACKFILL] Found existing workout from ${workoutDate}, backfill complete`);
              shouldContinue = false;
              break;
            } else {
              console.log(`🔄 [BACKFILL] Workout from ${workoutDate} doesn't exist yet, continuing backfill`);
            }
          }

          // Store the new workout
          const stored = await storeWorkoutInDynamoDB(workout);
          if (stored) {
            newWorkouts++;
            console.log(`📊 [BACKFILL] Progress: ${newWorkouts} new workouts stored`);
          } else {
            // Hit an existing workout, stop backfill
            console.log(`🛑 [BACKFILL] Hit existing workout, stopping backfill`);
            shouldContinue = false;
            break;
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
      mostRecentDate,
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