/**
 * Rebuild every legacy-shaped Exercises row (missing exercise_name/workout_date - the GSI's own
 * key attributes, so these rows are permanently invisible to exercise_name-workout_date-index,
 * which getExerciseHistory() depends on) into the current canonical schema.
 *
 * Legacy rows are a leftover raw-Hevy-shape ingestion (title/workout_start_time/index instead of
 * exercise_name/workout_date/exercise_index, no computed metrics) that predates this app's
 * calculateExerciseMetrics-based schema. Neither storeExercises() nor
 * backfillMissingExerciseRows.js can repair them - both use
 * ConditionExpression: attribute_not_exists(exercise_id), which correctly refuses to overwrite
 * an item that already exists, even one in this stale shape.
 *
 * Rebuilds from each affected workout's OWN denormalized exercises[] field on its Workouts item -
 * NOT from Hevy - so this is safe even for workouts Hevy no longer has (deleted-on-Hevy orphans):
 * (1) delete every legacy-shaped Exercises row for that workout_id, (2) call the shared
 * storeExercises(workout) to regenerate every one of that workout's exercise rows fresh in
 * canonical shape (exercise_id is deterministic - `${workout.id}_${index}` - so this replaces
 * the exact same rows, not new ones alongside them). Rows already in canonical shape are left
 * untouched entirely.
 *
 * Dry run (default, no writes): node src/scripts/migrateLegacyExerciseRows.js
 * Live run (writes to DynamoDB): LIVE=1 node src/scripts/migrateLegacyExerciseRows.js
 */
import './_env.js';
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, paginatedScan } from '../lib/dynamo.js';
import { DYNAMO_TABLES } from '../lib/constants.js';
import { storeExercises } from '../lib/workoutBackfill.js';

const LIVE = process.env.LIVE === '1';

function isLegacyShape(row) {
  return !('exercise_name' in row) || !('workout_date' in row);
}

async function findLegacyRowsByWorkout() {
  const allExercises = await paginatedScan({ TableName: DYNAMO_TABLES.EXERCISES_TABLE });
  const legacyRows = allExercises.filter(isLegacyShape);

  const byWorkout = new Map();
  legacyRows.forEach((row) => {
    if (!byWorkout.has(row.workout_id)) byWorkout.set(row.workout_id, []);
    byWorkout.get(row.workout_id).push(row);
  });

  return { legacyRows, byWorkout };
}

export { isLegacyShape, findLegacyRowsByWorkout };

async function main() {
  console.log(LIVE
    ? '🔴 [LIVE] Running in LIVE mode - legacy Exercises rows WILL be deleted and rebuilt'
    : '🟡 [DRY RUN] No writes will be made. Set LIVE=1 to apply changes.');

  console.log('📖 Scanning Exercises table for legacy-shaped rows...');
  const { legacyRows, byWorkout } = await findLegacyRowsByWorkout();
  console.log(`🔎 Found ${legacyRows.length} legacy row(s) across ${byWorkout.size} workout(s)\n`);

  let workoutsMigrated = 0;
  let workoutsSkipped = 0;
  let rowsDeleted = 0;

  for (const [workoutId, rows] of byWorkout) {
    const workoutRes = await docClient.send(new GetCommand({
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      Key: { id: workoutId },
    }));
    const workout = workoutRes.Item;

    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      console.log(`⚠️  Workout ${workoutId} missing or has no exercises[] - skipping (${rows.length} legacy row(s) left as-is)`);
      workoutsSkipped++;
      continue;
    }

    console.log(`➡️  Workout ${workoutId} (${workout.title || 'Untitled'}): ${rows.length} legacy row(s) to rebuild`);

    if (LIVE) {
      for (const row of rows) {
        await docClient.send(new DeleteCommand({
          TableName: DYNAMO_TABLES.EXERCISES_TABLE,
          Key: { exercise_id: row.exercise_id },
        }));
        rowsDeleted++;
      }
      await storeExercises(workout);
    } else {
      console.log(`   🟡 [DRY RUN] Would delete ${rows.length} row(s): ${rows.map(r => r.exercise_id).join(', ')}`);
      console.log(`   🟡 [DRY RUN] Would regenerate all ${workout.exercises.length} exercise row(s) for this workout`);
    }

    workoutsMigrated++;
  }

  console.log(`\n🎉 Done. ${workoutsMigrated} workout(s) ${LIVE ? 'migrated' : 'would be migrated'}, ${workoutsSkipped} skipped (workout missing or has no exercises[]).`);
  if (LIVE) {
    console.log(`   ${rowsDeleted} legacy row(s) deleted and regenerated in canonical shape.`);
  }
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
