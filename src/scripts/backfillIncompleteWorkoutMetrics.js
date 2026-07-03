/**
 * Backfill denormalized computed-metrics fields (exercises, totalVolume,
 * totalWarmupSets, totalWorkingSets, uniqueExercises, durationMinutes,
 * workoutType) onto Workouts items that are missing them.
 *
 * The real per-set data for these workouts already exists in the Exercises
 * table (queryable via the workout_id-index GSI) - it was just never
 * denormalized onto the Workouts item the way workoutBackfill.js does for
 * workouts fetched directly from the Hevy API. This script reuses the same
 * metric math (calculateWorkoutMetrics) rather than reimplementing it.
 *
 * Dry run (default, no writes): node src/scripts/backfillIncompleteWorkoutMetrics.js
 * Live run (writes to DynamoDB): LIVE=1 node src/scripts/backfillIncompleteWorkoutMetrics.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { calculateWorkoutMetrics } = require('../lib/workoutMetrics.js');
const { DYNAMO_TABLES } = require('../lib/constants.js');

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
 * A Workouts item is "incomplete" if it's missing the denormalized exercises field
 */
function isIncomplete(workoutItem) {
  return !workoutItem.exercises;
}

/**
 * Reshape Exercises-table rows (workout_id-index query results) into the
 * `workout.exercises` shape that calculateWorkoutMetrics expects. The current
 * row shape uses `title`/`index` (confirmed against an already-complete
 * Workouts item's `exercises[]`, written directly from these fields), but
 * some older rows in this table (pre-dating a schema change, or written by
 * an external process) use `exercise_name`/`exercise_index` instead - fall
 * back to those when the current-shape field is absent, so a mixed-schema
 * workout (some rows old shape, some new) reshapes correctly either way.
 */
function reshapeExerciseRows(exerciseRows) {
  return [...exerciseRows]
    .sort((a, b) => (a.index ?? a.exercise_index) - (b.index ?? b.exercise_index))
    .map(row => ({
      title: row.title ?? row.exercise_name,
      sets: row.sets,
    }));
}

/**
 * Compute the full set of fields to write back onto an incomplete Workouts item
 */
function buildMetricsUpdate(workoutItem, exerciseRows) {
  const exercises = reshapeExerciseRows(exerciseRows);
  const metrics = calculateWorkoutMetrics({
    start_time: workoutItem.start_time,
    end_time: workoutItem.end_time,
    exercises,
  });

  return {
    exercises,
    totalVolume: metrics.totalVolume,
    totalWarmupSets: metrics.totalWarmupSets,
    totalWorkingSets: metrics.totalWorkingSets,
    uniqueExercises: metrics.uniqueExercises,
    durationMinutes: metrics.durationMinutes,
    workoutType: metrics.workoutType,
  };
}

async function scanIncompleteWorkouts(docClient) {
  const incomplete = [];
  let lastEvaluatedKey;

  do {
    const params = { TableName: DYNAMO_TABLES.WORKOUTS_TABLE };
    if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;

    const result = await docClient.send(new ScanCommand(params));
    const items = result.Items || [];
    incomplete.push(...items.filter(isIncomplete));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return incomplete;
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

async function writeMetricsUpdate(docClient, workoutId, update) {
  const params = {
    TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
    Key: { id: workoutId },
    UpdateExpression: 'SET exercises = :exercises, totalVolume = :totalVolume, ' +
      'totalWarmupSets = :totalWarmupSets, totalWorkingSets = :totalWorkingSets, ' +
      'uniqueExercises = :uniqueExercises, durationMinutes = :durationMinutes, ' +
      'workoutType = :workoutType',
    ExpressionAttributeValues: {
      ':exercises': update.exercises,
      ':totalVolume': update.totalVolume,
      ':totalWarmupSets': update.totalWarmupSets,
      ':totalWorkingSets': update.totalWorkingSets,
      ':uniqueExercises': update.uniqueExercises,
      ':durationMinutes': update.durationMinutes,
      ':workoutType': update.workoutType,
    },
  };

  await docClient.send(new UpdateCommand(params));
}

async function main() {
  console.log(LIVE
    ? '🔴 [LIVE] Running in LIVE mode - Workouts items WILL be updated'
    : '🟡 [DRY RUN] No writes will be made. Set LIVE=1 to apply changes.');

  const docClient = getDocClient();

  console.log('📖 Scanning Workouts table for items missing computed metrics...');
  const incompleteWorkouts = await scanIncompleteWorkouts(docClient);
  console.log(`🔎 Found ${incompleteWorkouts.length} incomplete workout(s)`);

  let updated = 0;
  let skipped = 0;

  for (const workout of incompleteWorkouts) {
    console.log(`\n➡️  Workout ${workout.id} (${workout.title || 'Untitled Workout'})`);

    const exerciseRows = await getExerciseRowsForWorkout(docClient, workout.id);

    if (exerciseRows.length === 0) {
      console.log(`⚠️  No Exercises rows found for workout ${workout.id}, skipping`);
      skipped++;
      continue;
    }

    const update = buildMetricsUpdate(workout, exerciseRows);
    console.log(`   📊 ${exerciseRows.length} exercises, totalVolume=${update.totalVolume}, ` +
      `totalWorkingSets=${update.totalWorkingSets}, totalWarmupSets=${update.totalWarmupSets}, ` +
      `uniqueExercises=${update.uniqueExercises}, durationMinutes=${update.durationMinutes}, ` +
      `workoutType=${update.workoutType}`);

    if (LIVE) {
      await writeMetricsUpdate(docClient, workout.id, update);
      console.log(`   ✅ Updated workout ${workout.id}`);
      await sleep(150);
    } else {
      console.log(`   🟡 [DRY RUN] Would update workout ${workout.id}`);
    }

    updated++;
  }

  console.log(`\n🎉 Done. ${updated} workout(s) ${LIVE ? 'updated' : 'would be updated'}, ${skipped} skipped (no matching exercises).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Backfill failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  isIncomplete,
  reshapeExerciseRows,
  buildMetricsUpdate,
};
