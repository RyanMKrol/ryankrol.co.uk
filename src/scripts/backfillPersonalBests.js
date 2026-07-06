/**
 * One-time retroactive pass to compute personal-best (PR) flags across ALL existing Exercises
 * rows. The live write path (storeExercises/storeWorkoutInDynamoDB) only ever compares a NEW
 * workout against history that already has these flags computed - every row that existed before
 * that shipped has never been compared against anything. This script replays history from
 * scratch: group every Exercises row by exercise_name, walk each group CHRONOLOGICALLY ASCENDING
 * (oldest first - the opposite order from the live write path, which only ever sees the newest
 * workout), and recompute a running best per exercise as it goes, so each row is judged against
 * only what genuinely came before it.
 *
 * Metrics/set-indices are recomputed fresh from each row's own stored sets[] via
 * calculateExerciseMetrics - pre-existing rows won't have bestSetVolume/set-indices at all, and
 * even rows that do carry aggregate fields aren't trusted for this replay.
 *
 * Every row with a new PR gets its flag(s) written onto the specific set index/indices in BOTH
 * the Exercises table row (`sets`) and the matching Workouts item's embedded
 * `exercises[j].sets` (same exercise position/set index) - both are read by different pages
 * (list vs. detail).
 *
 * Dry run (default, no writes): node src/scripts/backfillPersonalBests.js
 * Live run (writes to DynamoDB): LIVE=1 node src/scripts/backfillPersonalBests.js
 */
import './_env.js';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, paginatedScan, buildSetUpdateParams } from '../lib/dynamo.js';
import { DYNAMO_TABLES } from '../lib/constants.js';
import { calculateExerciseMetrics, detectPersonalBests } from '../lib/workoutMetrics.js';

const LIVE = process.env.LIVE === '1';

/**
 * Group Exercises rows by exercise_name, then sort each group chronologically ascending
 * (oldest workout_date first) so a running best can be walked forward correctly.
 */
function groupByExerciseNameChronological(rows) {
  const byName = new Map();
  rows.forEach((row) => {
    if (!byName.has(row.exercise_name)) byName.set(row.exercise_name, []);
    byName.get(row.exercise_name).push(row);
  });

  byName.forEach((group) => {
    group.sort((a, b) => new Date(a.workout_date) - new Date(b.workout_date));
  });

  return byName;
}

/**
 * Walk every exercise_name group oldest-to-newest, recomputing session metrics fresh from each
 * row's own sets[], detecting PRs against the running best built up so far, and updating the
 * running best for any axis just beaten. Returns the list of rows that have at least one new PR,
 * annotated with the specific set indices to flag.
 */
function computePersonalBestUpdates(rows) {
  const byName = groupByExerciseNameChronological(rows);
  const updates = [];

  byName.forEach((group, exerciseName) => {
    let runningBest = null;

    group.forEach((row) => {
      const sessionMetrics = calculateExerciseMetrics({ sets: row.sets });
      const { weightPRSetIndex, oneRepMaxPRSetIndex, volumePRSetIndex } =
        detectPersonalBests(sessionMetrics, runningBest);

      if (weightPRSetIndex != null || oneRepMaxPRSetIndex != null || volumePRSetIndex != null) {
        updates.push({
          exerciseName,
          row,
          weightPRSetIndex,
          oneRepMaxPRSetIndex,
          volumePRSetIndex,
        });
      }

      const higherOf = (sessionValue, priorValue) => {
        if (sessionValue == null) return priorValue ?? null;
        if (priorValue == null) return sessionValue;
        return Math.max(sessionValue, priorValue);
      };

      runningBest = {
        heaviestWeight: higherOf(sessionMetrics.heaviestWeight, runningBest?.heaviestWeight),
        bestEstimated1RM: higherOf(sessionMetrics.bestEstimated1RM, runningBest?.bestEstimated1RM),
        bestSetVolume: higherOf(sessionMetrics.bestSetVolume, runningBest?.bestSetVolume),
      };
    });
  });

  return updates;
}

function applyFlagsToSets(sets, update) {
  const flagged = sets.map((set) => ({ ...set }));
  if (update.weightPRSetIndex != null) flagged[update.weightPRSetIndex].isWeightPR = true;
  if (update.oneRepMaxPRSetIndex != null) flagged[update.oneRepMaxPRSetIndex].is1RMPR = true;
  if (update.volumePRSetIndex != null) flagged[update.volumePRSetIndex].isVolumePR = true;
  return flagged;
}

export { groupByExerciseNameChronological, computePersonalBestUpdates, applyFlagsToSets };

async function main() {
  console.log(LIVE
    ? '🔴 [LIVE] Running in LIVE mode - PR flags WILL be written to Exercises and Workouts rows'
    : '🟡 [DRY RUN] No writes will be made. Set LIVE=1 to apply changes.');

  console.log('📖 Scanning Exercises table...');
  const allExercises = await paginatedScan({ TableName: DYNAMO_TABLES.EXERCISES_TABLE });
  console.log(`🔎 Found ${allExercises.length} exercise row(s)\n`);

  const updates = computePersonalBestUpdates(allExercises);
  console.log(`🏆 ${updates.length} row(s) have at least one new personal best\n`);

  let rowsUpdated = 0;

  for (const update of updates) {
    const { row } = update;
    const axes = [
      update.weightPRSetIndex != null ? `weight@set${update.weightPRSetIndex}` : null,
      update.oneRepMaxPRSetIndex != null ? `1RM@set${update.oneRepMaxPRSetIndex}` : null,
      update.volumePRSetIndex != null ? `volume@set${update.volumePRSetIndex}` : null,
    ].filter(Boolean).join(', ');

    console.log(`➡️  ${row.exercise_name} on ${row.workout_date} (${row.exercise_id}): ${axes}`);

    if (!LIVE) {
      console.log(`   🟡 [DRY RUN] Would flag: ${axes}`);
      continue;
    }

    const flaggedSets = applyFlagsToSets(row.sets, update);

    await docClient.send(new UpdateCommand(buildSetUpdateParams(
      DYNAMO_TABLES.EXERCISES_TABLE,
      { exercise_id: row.exercise_id },
      { sets: flaggedSets }
    )));

    const workoutRes = await docClient.send(new GetCommand({
      TableName: DYNAMO_TABLES.WORKOUTS_TABLE,
      Key: { id: row.workout_id },
    }));
    const workout = workoutRes.Item;

    if (workout && workout.exercises && workout.exercises[row.exercise_index]) {
      const updatedExercises = workout.exercises.map((exercise, index) =>
        index === row.exercise_index ? { ...exercise, sets: flaggedSets } : exercise
      );

      await docClient.send(new UpdateCommand(buildSetUpdateParams(
        DYNAMO_TABLES.WORKOUTS_TABLE,
        { id: row.workout_id },
        { exercises: updatedExercises }
      )));
    } else {
      console.log(`   ⚠️  Workout ${row.workout_id} missing or has no exercise at index ${row.exercise_index} - Exercises row updated, Workouts row skipped`);
    }

    rowsUpdated++;
  }

  console.log(`\n🎉 Done. ${updates.length} row(s) had new personal bests, ` +
    (LIVE ? `${rowsUpdated} row(s) updated.` : 'no writes made (dry run).'));
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
}
