import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BACKFILL_FLAG = process.argv.includes('--backfill');

// --- Phase 1: Fetch all workouts from Hevy API ---

async function fetchAllWorkoutsFromHevy() {
  const HEVY_API_KEY = process.env.HEVY_API_KEY;

  if (!HEVY_API_KEY) {
    throw new Error('HEVY_API_KEY environment variable not found');
  }

  console.log('Fetching all workouts from Hevy API...');

  let allWorkouts = [];
  let page = 1;
  let hasMorePages = true;
  const pageSize = 10;

  while (hasMorePages) {
    console.log(`  Fetching page ${page}...`);

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

    console.log(`  Got ${data.workouts?.length || 0} workouts (page ${data.page} of ${data.page_count})`);

    if (data.workouts && data.workouts.length > 0) {
      allWorkouts.push(...data.workouts);
    }

    hasMorePages = data.page < data.page_count;
    page++;

    await sleep(150);
  }

  console.log(`Fetched ${allWorkouts.length} total workouts from Hevy\n`);
  return allWorkouts;
}

// --- Phase 2: Scan all workouts from DynamoDB (paginated) ---

async function fetchAllWorkoutsFromDynamo() {
  console.log('Scanning all workouts from DynamoDB...');

  let allItems = [];
  let lastEvaluatedKey = undefined;

  do {
    const params = {
      TableName: 'Workouts',
      ProjectionExpression: 'id, title, start_time, workoutDate',
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await dynamodb.send(new ScanCommand(params));
    const items = result.Items || [];
    allItems.push(...items);
    lastEvaluatedKey = result.LastEvaluatedKey;

    if (lastEvaluatedKey) {
      console.log(`  Scanned ${allItems.length} workouts so far, fetching next page...`);
    }
  } while (lastEvaluatedKey);

  console.log(`Scanned ${allItems.length} total workouts from DynamoDB\n`);
  return allItems;
}

// --- Phase 3: Compare by workout ID ---

function compareWorkouts(hevyWorkouts, dynamoWorkouts) {
  const hevyIds = new Set(hevyWorkouts.map(w => w.id));
  const dynamoIds = new Set(dynamoWorkouts.map(w => w.id));

  const missingFromDynamo = hevyWorkouts.filter(w => !dynamoIds.has(w.id));
  const orphansInDynamo = dynamoWorkouts.filter(w => !hevyIds.has(w.id));
  const matchCount = [...hevyIds].filter(id => dynamoIds.has(id)).length;

  return { missingFromDynamo, orphansInDynamo, matchCount };
}

// --- Phase 4: Print audit report ---

function printReport(hevyCount, dynamoCount, { missingFromDynamo, orphansInDynamo, matchCount }) {
  console.log('=== Workout Audit Report ===\n');
  console.log(`Hevy workouts:   ${hevyCount}`);
  console.log(`DynamoDB workouts: ${dynamoCount}`);
  console.log(`Matched:         ${matchCount}`);
  console.log(`Missing from DB: ${missingFromDynamo.length}`);
  console.log(`Orphans in DB:   ${orphansInDynamo.length}`);

  if (missingFromDynamo.length > 0) {
    console.log('\n--- Missing from DynamoDB ---');
    missingFromDynamo
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .forEach(w => {
        const date = new Date(w.start_time).toISOString().split('T')[0];
        console.log(`  ${date}  ${w.title || 'Untitled'}  (${w.id})`);
      });
  }

  if (orphansInDynamo.length > 0) {
    console.log('\n--- Orphans in DynamoDB (not in Hevy) ---');
    orphansInDynamo
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .forEach(w => {
        const date = w.workoutDate || new Date(w.start_time).toISOString().split('T')[0];
        console.log(`  ${date}  ${w.title || 'Untitled'}  (${w.id})`);
      });
  }

  console.log('');
}

// --- Phase 5: Backfill missing workouts ---

async function backfillMissing(missingWorkouts) {
  console.log(`Backfilling ${missingWorkouts.length} missing workouts...\n`);

  let workoutsStored = 0;
  let workoutsSkipped = 0;
  let exercisesStored = 0;
  let exercisesSkipped = 0;

  for (let i = 0; i < missingWorkouts.length; i++) {
    const workout = missingWorkouts[i];
    const date = new Date(workout.start_time).toISOString().split('T')[0];
    console.log(`[${i + 1}/${missingWorkouts.length}] ${date} - ${workout.title || 'Untitled'} (${workout.id})`);

    // Store workout
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
      backfilled_at: new Date().toISOString(),
    };

    try {
      await dynamodb.send(new PutCommand({
        TableName: 'Workouts',
        Item: workoutItem,
        ConditionExpression: 'attribute_not_exists(id)',
      }));
      workoutsStored++;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        console.log(`  Workout already exists, skipping`);
        workoutsSkipped++;
        continue;
      }
      throw error;
    }

    // Store exercises
    const workoutDate = new Date(workout.start_time).toISOString().split('T')[0];
    for (let j = 0; j < workout.exercises.length; j++) {
      const exercise = workout.exercises[j];
      const exerciseMetrics = calculateExerciseMetrics(exercise);

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
        backfilled_at: new Date().toISOString(),
      };

      try {
        await dynamodb.send(new PutCommand({
          TableName: 'Exercises',
          Item: exerciseItem,
          ConditionExpression: 'attribute_not_exists(exercise_id)',
        }));
        exercisesStored++;
      } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
          exercisesSkipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`  Stored workout + ${workout.exercises.length} exercises`);
  }

  console.log('\n=== Backfill Summary ===');
  console.log(`Workouts: ${workoutsStored} stored, ${workoutsSkipped} skipped`);
  console.log(`Exercises: ${exercisesStored} stored, ${exercisesSkipped} skipped`);
}

// --- Main ---

async function main() {
  console.log(`Workout Audit${BACKFILL_FLAG ? ' + Backfill' : ''}\n`);

  const hevyWorkouts = await fetchAllWorkoutsFromHevy();
  const dynamoWorkouts = await fetchAllWorkoutsFromDynamo();
  const comparison = compareWorkouts(hevyWorkouts, dynamoWorkouts);

  printReport(hevyWorkouts.length, dynamoWorkouts.length, comparison);

  if (BACKFILL_FLAG && comparison.missingFromDynamo.length > 0) {
    await backfillMissing(comparison.missingFromDynamo);
  } else if (BACKFILL_FLAG && comparison.missingFromDynamo.length === 0) {
    console.log('Nothing to backfill - all workouts are in sync.');
  }
}

main().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});
