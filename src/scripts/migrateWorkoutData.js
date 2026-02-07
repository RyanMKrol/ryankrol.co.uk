import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { calculateExerciseMetrics, calculateWorkoutMetrics } from '../lib/workoutMetrics.js';

dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamodb = DynamoDBDocumentClient.from(client);

// Rate limiting helper - 100ms between calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllWorkoutsFromHevy() {
  const HEVY_API_KEY = process.env.HEVY_API_KEY;

  if (!HEVY_API_KEY) {
    throw new Error('HEVY_API_KEY environment variable not found');
  }

  console.log('📡 Starting to fetch all workouts from Hevy API...');

  let allWorkouts = [];
  let page = 1;
  let hasMorePages = true;
  const pageSize = 10; // Max page size for Hevy API

  while (hasMorePages) {
    console.log(`📄 Fetching page ${page}...`);

    try {
      const response = await fetch(
        `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`,
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

      console.log(`   ✅ Got ${data.workouts?.length || 0} workouts (page ${data.page} of ${data.page_count})`);

      if (data.workouts && data.workouts.length > 0) {
        allWorkouts.push(...data.workouts);
      }

      // Check if there are more pages
      hasMorePages = data.page < data.page_count;
      page++;

      // Rate limiting - wait 100ms between requests
      await sleep(100);

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      throw error;
    }
  }

  console.log(`🎉 Successfully fetched ${allWorkouts.length} total workouts from Hevy\n`);
  return allWorkouts;
}

// Metric calculation functions moved to shared library: ../lib/workoutMetrics.js

async function storeWorkoutInDynamoDB(workout) {
  const metrics = calculateWorkoutMetrics(workout);

  const workoutItem = {
    id: workout.id,
    title: workout.title || 'Untitled Workout',
    start_time: workout.start_time,
    end_time: workout.end_time,
    exercises: workout.exercises,
    // Computed metrics
    ...metrics,
    // Metadata
    created_at: new Date().toISOString(),
    data_source: 'hevy_api'
  };

  const params = {
    TableName: 'Workouts',
    Item: workoutItem,
    ConditionExpression: 'attribute_not_exists(id)' // Don't overwrite existing workouts
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`   ⚠️  Workout ${workout.id} already exists, skipping`);
      return false;
    } else {
      throw error;
    }
  }
}

async function storeExerciseInDynamoDB(workout, exercise, exerciseIndex) {
  const metrics = calculateExerciseMetrics(exercise);
  const workoutDate = new Date(workout.start_time).toISOString().split('T')[0];

  const exerciseItem = {
    exercise_id: `${workout.id}_${exerciseIndex}`,
    workout_id: workout.id,
    exercise_name: exercise.title,
    workout_date: workoutDate,
    workout_title: workout.title || 'Untitled Workout',
    start_time: workout.start_time,
    end_time: workout.end_time,
    sets: exercise.sets,
    exercise_index: exerciseIndex,
    // Computed metrics
    ...metrics,
    // Metadata
    created_at: new Date().toISOString(),
    data_source: 'hevy_api'
  };

  const params = {
    TableName: 'Exercises',
    Item: exerciseItem,
    ConditionExpression: 'attribute_not_exists(exercise_id)' // Don't overwrite existing exercises
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`   ⚠️  Exercise ${exerciseItem.exercise_id} already exists, skipping`);
      return false;
    } else {
      throw error;
    }
  }
}

async function migrateWorkoutData(workouts) {
  console.log(`💾 Starting to store ${workouts.length} workouts in DynamoDB...\n`);

  let workoutsStored = 0;
  let workoutsSkipped = 0;
  let exercisesStored = 0;
  let exercisesSkipped = 0;

  for (let i = 0; i < workouts.length; i++) {
    const workout = workouts[i];
    console.log(`📝 Processing workout ${i + 1}/${workouts.length}: "${workout.title}" (${workout.id})`);

    try {
      // Store workout
      const workoutStored = await storeWorkoutInDynamoDB(workout);
      if (workoutStored) {
        workoutsStored++;
      } else {
        workoutsSkipped++;
      }

      // Store each exercise
      for (let j = 0; j < workout.exercises.length; j++) {
        const exercise = workout.exercises[j];
        const exerciseStored = await storeExerciseInDynamoDB(workout, exercise, j);
        if (exerciseStored) {
          exercisesStored++;
        } else {
          exercisesSkipped++;
        }
      }

      console.log(`   ✅ Processed workout with ${workout.exercises.length} exercises`);

    } catch (error) {
      console.error(`   ❌ Error processing workout ${workout.id}:`, error);
    }
  }

  console.log('\n🎉 Migration completed!');
  console.log(`📊 Summary:`);
  console.log(`   Workouts: ${workoutsStored} stored, ${workoutsSkipped} skipped`);
  console.log(`   Exercises: ${exercisesStored} stored, ${exercisesSkipped} skipped`);
}

async function main() {
  console.log('🚀 Starting workout data migration from Hevy to DynamoDB...\n');

  try {
    // Fetch all workouts from Hevy API
    const workouts = await fetchAllWorkoutsFromHevy();

    if (workouts.length === 0) {
      console.log('⚠️  No workouts found, nothing to migrate');
      return;
    }

    // Store all workouts and exercises in DynamoDB
    await migrateWorkoutData(workouts);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
