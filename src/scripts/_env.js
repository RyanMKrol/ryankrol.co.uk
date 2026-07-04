/**
 * Load .env.local before any sibling import evaluates. ES module imports are hoisted and
 * evaluated in source order before the importing script's own procedural code runs - so a
 * plain `import dotenv from 'dotenv'; dotenv.config(...)` written at the top of a script is
 * still too late if that script also imports src/lib/dynamo.js (or anything that imports it,
 * e.g. workoutBackfill.js/workoutQueries.js), since dynamo.js's own DynamoDBClient is
 * constructed eagerly at ITS module-top-level, before the importing script's dotenv.config()
 * call ever executes. Importing THIS file first (its own top-level code runs dotenv.config()
 * as part of ES module evaluation, not as procedural code in the importing script) closes
 * that gap. Confirmed live: without this, `node src/scripts/auditWorkouts.js` failed with
 * "Resolved credential object is not valid" because AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
 * were still undefined when dynamo.js's client was constructed.
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
