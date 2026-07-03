/**
 * Resync the FULL set of computed-metrics fields (workoutDate, totalVolume,
 * totalWarmupSets, totalWorkingSets, uniqueExercises, strengthExercises, cardioExercises,
 * totalDistance, totalDuration, durationMinutes, workoutType) onto every Workouts item.
 *
 * Every item's metrics are recomputed via calculateWorkoutMetrics() and written back by
 * spreading its ENTIRE return value (buildSetUpdateParams) - never a hand-picked field
 * list. A hand-picked list is exactly how `workoutDate` went silently missing from 72
 * production workouts in 2026-07: this script's own previous version, and
 * workoutBackfill.js's "heal incomplete workout" path, both called calculateWorkoutMetrics
 * (which computes workoutDate) but then wrote back only a subset of its fields.
 *
 * Two cases, unified into one pass:
 *   1. Item already has `exercises` denormalized -> recompute metrics directly from it.
 *   2. Item is missing `exercises` -> reconstruct it from the Exercises table (queryable
 *      via the workout_id-index GSI), the same real per-set data workoutBackfill.js
 *      denormalizes for workouts fetched directly from the Hevy API.
 *
 * Safe to re-run: recomputation is a pure function of start_time/end_time/exercises, so
 * already-correct items are just rewritten to the same values.
 *
 * Dry run (default, no writes): node src/scripts/backfillIncompleteWorkoutMetrics.js
 * Live run (writes to DynamoDB): LIVE=1 node src/scripts/backfillIncompleteWorkoutMetrics.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { calculateWorkoutMetrics } = require('../lib/workoutMetrics.js');
const { DYNAMO_TABLES } = require('../lib/constants.js');
const { buildSetUpdateParams } = require('../lib/dynamo.js');

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
 * A Workouts item is missing its denormalized exercises field and needs it reconstructed
 * from the Exercises table before metrics can be computed.
 */
function isMissingExercises(workoutItem) {
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
 * Compute the full set of fields to write back onto a Workouts item - always the
 * complete calculateWorkoutMetrics() output, never a hand-picked subset.
 */
function buildMetricsUpdate(workoutItem, exercises) {
  const metrics = calculateWorkoutMetrics({
    start_time: workoutItem.start_time,
    end_time: workoutItem.end_time,
    exercises,
  });

  return { exercises, ...metrics };
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

async function writeMetricsUpdate(docClient, workoutId, update) {
  const params = buildSetUpdateParams(DYNAMO_TABLES.WORKOUTS_TABLE, { id: workoutId }, update);
  await docClient.send(new UpdateCommand(params));
}

async function main() {
  console.log(LIVE
    ? '🔴 [LIVE] Running in LIVE mode - Workouts items WILL be updated'
    : '🟡 [DRY RUN] No writes will be made. Set LIVE=1 to apply changes.');

  const docClient = getDocClient();

  console.log('📖 Scanning Workouts table...');
  const allWorkouts = await scanAllWorkouts(docClient);
  console.log(`🔎 Found ${allWorkouts.length} workout(s) - resyncing computed metrics for all of them\n`);

  let updated = 0;
  let reconstructed = 0;
  let skipped = 0;

  for (const workout of allWorkouts) {
    console.log(`➡️  Workout ${workout.id} (${workout.title || 'Untitled Workout'})`);

    let exercises = workout.exercises;
    if (isMissingExercises(workout)) {
      const exerciseRows = await getExerciseRowsForWorkout(docClient, workout.id);
      if (exerciseRows.length === 0) {
        console.log(`   ⚠️  No Exercises rows found for workout ${workout.id}, skipping`);
        skipped++;
        continue;
      }
      exercises = reshapeExerciseRows(exerciseRows);
      reconstructed++;
    }

    const update = buildMetricsUpdate(workout, exercises);
    console.log(`   📊 workoutDate=${update.workoutDate}, totalVolume=${update.totalVolume}, ` +
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

  console.log(`\n🎉 Done. ${updated} workout(s) ${LIVE ? 'updated' : 'would be updated'} ` +
    `(${reconstructed} had exercises reconstructed from the Exercises table), ` +
    `${skipped} skipped (no matching exercises anywhere).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Backfill failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  isMissingExercises,
  reshapeExerciseRows,
  buildMetricsUpdate,
};
