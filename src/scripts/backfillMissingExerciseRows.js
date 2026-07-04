/**
 * Backfill missing Exercises-table rows using the real per-set data that already
 * exists on each Workouts item's own `exercises[]` field. Most workouts only ever
 * got their Workouts row written; the standalone Exercises table (queried per-exercise
 * by exercise_id, workout_id-index, exercise_name-workout_date-index) never got a
 * matching row for every exercise. This is purely additive - it never deletes anything.
 *
 * Dry run (default, no writes): node src/scripts/backfillMissingExerciseRows.js
 * Live run (writes to DynamoDB): LIVE=1 node src/scripts/backfillMissingExerciseRows.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { DYNAMO_TABLES } = require('../lib/constants.js');
const { storeExercises } = require('../lib/workoutBackfill.js');

const LIVE = process.env.LIVE === '1';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getDocClient() {
  const client = new DynamoDBClient({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return DynamoDBDocumentClient.from(client);
}

/**
 * Given the number of exercises a Workouts item has, and the Exercises-table rows
 * that already exist for it (workout_id-index query results), return the list of
 * exercise indexes with no matching row - i.e. `${workout.id}_${index}` doesn't exist yet.
 */
function missingExerciseIndexes(exerciseCount, existingRows) {
  const existingIndexes = new Set(
    existingRows.map(row => row.exercise_index ?? row.index)
  );

  const missing = [];
  for (let index = 0; index < exerciseCount; index++) {
    if (!existingIndexes.has(index)) {
      missing.push(index);
    }
  }
  return missing;
}

async function scanAllWorkouts(docClient) {
  const items = [];
  let lastEvaluatedKey;

  do {
    const params = { TableName: DYNAMO_TABLES.WORKOUTS_TABLE };
    if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;

    const result = await docClient.send(new ScanCommand(params));
    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function getExerciseRowsForWorkout(docClient, workoutId) {
  const params = {
    TableName: DYNAMO_TABLES.EXERCISES_TABLE,
    IndexName: 'workout_id-index',
    KeyConditionExpression: 'workout_id = :workoutId',
    ExpressionAttributeValues: { ':workoutId': workoutId },
  };

  const result = await docClient.send(new QueryCommand(params));
  return result.Items || [];
}

async function main() {
  console.log(LIVE
    ? '🔴 [LIVE] Running in LIVE mode - missing Exercises rows WILL be created'
    : '🟡 [DRY RUN] No writes will be made. Set LIVE=1 to apply changes.');

  const docClient = getDocClient();

  console.log('📖 Scanning Workouts table...');
  const allWorkouts = await scanAllWorkouts(docClient);
  console.log(`🔎 Found ${allWorkouts.length} workout(s)\n`);

  let totalMissing = 0;
  let workoutsProcessed = 0;
  let exerciseRowsCreated = 0;

  for (const workout of allWorkouts) {
    if (!workout.exercises || workout.exercises.length === 0) {
      continue;
    }

    const existingRows = await getExerciseRowsForWorkout(docClient, workout.id);
    const missing = missingExerciseIndexes(workout.exercises.length, existingRows);

    if (missing.length === 0) {
      continue;
    }

    totalMissing += missing.length;
    console.log(`➡️  Workout ${workout.id} (${workout.title || 'Untitled Workout'}): ` +
      `missing ${missing.length}/${workout.exercises.length} exercise row(s) [indexes: ${missing.join(', ')}]`);

    if (LIVE) {
      await storeExercises({
        id: workout.id,
        start_time: workout.start_time,
        end_time: workout.end_time,
        title: workout.title,
        exercises: workout.exercises,
      });
      exerciseRowsCreated += missing.length;
      workoutsProcessed++;
      await sleep(150);
    } else {
      console.log(`   🟡 [DRY RUN] Would create ${missing.length} exercise row(s)`);
    }
  }

  console.log(`\n🎉 Done. ${allWorkouts.length} workout(s) scanned, ` +
    `${totalMissing} missing exercise row(s) found` +
    (LIVE
      ? ` across ${workoutsProcessed} workout(s), ${exerciseRowsCreated} exercise row(s) created.`
      : ' (dry run - no writes made).'));
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Backfill failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  missingExerciseIndexes,
};
