/**
 * Migration script: remove the `editedDate` attribute that metadata-only Bulk Backfill applies
 * incorrectly stamped onto MovieRatings/TelevisionRatings/BookRatings/AlbumRatings rows, before
 * the update routes were fixed to skip it for backfill applies (skipEditedDate).
 *
 * DRY RUN BY DEFAULT — prints what it would change, writes nothing.
 * Run for real with: LIVE=1 node src/scripts/stripBackfillEditedDates.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { DYNAMO_TABLES } = require('../lib/constants');

// The one exact value confirmed (via the live production API) to be the backfill artifact —
// every row across all 4 tables that has an editedDate has this value, with a single deliberate
// exception (one TV row dated 06-07-2026, left alone on purpose).
const BACKFILL_EDITED_DATE = '09-07-2026';

const TABLES = [
  DYNAMO_TABLES.MOVIE_RATINGS_TABLE,
  DYNAMO_TABLES.TV_RATINGS_TABLE,
  DYNAMO_TABLES.BOOK_RATINGS_TABLE,
  DYNAMO_TABLES.ALBUM_RATINGS_TABLE,
];

const IS_LIVE = process.env.LIVE === '1';

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

/** True if this row's editedDate is the known backfill artifact and should be stripped. */
function shouldStrip(item) {
  return item.editedDate === BACKFILL_EDITED_DATE;
}

async function scanRowsToStrip(tableName) {
  const result = await dynamoDb.send(new ScanCommand({ TableName: tableName }));
  return (result.Items || []).filter(shouldStrip);
}

async function stripRow(tableName, row) {
  await dynamoDb.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: row.id },
    UpdateExpression: 'REMOVE editedDate',
  }));
}

async function migrateTable(tableName) {
  console.log(`\n📼 Scanning ${tableName} for rows with editedDate=${BACKFILL_EDITED_DATE}...`);
  const rows = await scanRowsToStrip(tableName);
  console.log(`✅ Found ${rows.length} row(s) to strip`);

  for (const row of rows) {
    console.log(`  "${row.title || row.id}"`);
    if (IS_LIVE) {
      await stripRow(tableName, row);
      console.log('    💾 stripped');
    }
  }

  return rows.length;
}

async function migrate() {
  console.log(`\n🚀 Starting editedDate strip (${IS_LIVE ? 'LIVE' : 'DRY RUN'})`);
  if (!IS_LIVE) {
    console.log('⚠️  Dry run — no writes will be made. Set LIVE=1 to perform real updates.');
  }

  let total = 0;
  for (const tableName of TABLES) {
    total += await migrateTable(tableName);
  }

  console.log(`\n🎉 ${IS_LIVE ? 'Completed' : 'Dry run'} — ${total} row(s) processed across ${TABLES.length} tables`);
}

async function main() {
  try {
    await migrate();
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  migrate,
  shouldStrip,
  BACKFILL_EDITED_DATE,
};
