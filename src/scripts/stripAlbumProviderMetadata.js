/**
 * Migration script: strip ALL third-party / backfill-sourced metadata from AlbumRatingsV3,
 * keeping only the fields the owner authored by hand. Over time several different Last.fm
 * backfill schemas have written to these rows, leaving some albums with a `lastfm` object that
 * carries a `url` but no usable cover images — which makes needsAlbumBackfill() (src/lib/
 * backfillEligibility.js: `!item.lastfm || !item.lastfm.url`) treat them as "done" even though
 * they render with no thumbnail, so the backfill page shows "Nothing to backfill".
 *
 * This clears `thumbnail`, `lastfm`, and any other non-authored attribute, flipping every row
 * back to eligible so the backfill can run again from a clean slate.
 *
 * KEEP-LIST (not a fixed target-list like stripOldBookProviderMetadata.js): we keep exactly the
 * authored fields and remove EVERYTHING else, so stray fields from any past schema are cleared
 * too — not just a known set.
 *
 * DRY RUN BY DEFAULT — prints what it would change, writes nothing.
 * Run for real with: LIVE=1 node src/scripts/stripAlbumProviderMetadata.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { DYNAMO_TABLES } = require('../lib/constants');

// The ONLY fields to preserve — everything the owner authored by hand. `id` is the partition key
// (never removable anyway). Every other attribute on a row is third-party/backfill metadata and
// gets stripped.
const KEEP_FIELDS = ['id', 'title', 'artist', 'rating', 'highlights', 'date'];

const IS_LIVE = process.env.LIVE === '1';

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

/** Returns the attributes on this row that are NOT in KEEP_FIELDS, i.e. what would be stripped. */
function fieldsToStrip(item) {
  return Object.keys(item).filter((field) => !KEEP_FIELDS.includes(field));
}

async function scanRowsToStrip(tableName) {
  const result = await dynamoDb.send(new ScanCommand({ TableName: tableName }));
  return (result.Items || [])
    .map((item) => ({ item, fields: fieldsToStrip(item) }))
    .filter(({ fields }) => fields.length > 0);
}

/**
 * Build a REMOVE UpdateExpression that aliases every attribute via ExpressionAttributeNames.
 * Aliasing is required because a stripped field may be a DynamoDB reserved keyword and cannot
 * appear literally in an UpdateExpression. Returns `{ UpdateExpression, ExpressionAttributeNames }`.
 */
function buildRemoveExpression(fields) {
  const names = {};
  fields.forEach((field, i) => {
    names[`#f${i}`] = field;
  });
  return {
    UpdateExpression: `REMOVE ${fields.map((_, i) => `#f${i}`).join(', ')}`,
    ExpressionAttributeNames: names,
  };
}

async function stripRow(tableName, row, fields) {
  await dynamoDb.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: row.id },
    ...buildRemoveExpression(fields),
  }));
}

async function migrateTable(tableName) {
  console.log(`\n📼 Scanning ${tableName} for rows with third-party/backfill metadata...`);
  const rows = await scanRowsToStrip(tableName);
  console.log(`✅ Found ${rows.length} row(s) to strip`);

  for (const { item, fields } of rows) {
    console.log(`  "${item.title || item.id}" by ${item.artist || '?'} — stripping: ${fields.join(', ')}`);
    if (IS_LIVE) {
      await stripRow(tableName, item, fields);
      console.log('    💾 stripped');
    }
  }

  return rows.length;
}

async function migrate() {
  console.log(`\n🚀 Starting album third-party metadata strip (${IS_LIVE ? 'LIVE' : 'DRY RUN'})`);
  console.log(`   Keeping only: ${KEEP_FIELDS.join(', ')}`);
  if (!IS_LIVE) {
    console.log('⚠️  Dry run — no writes will be made. Set LIVE=1 to perform real updates.');
  }

  const total = await migrateTable(DYNAMO_TABLES.ALBUM_RATINGS_TABLE);

  console.log(`\n🎉 ${IS_LIVE ? 'Completed' : 'Dry run'} — ${total} row(s) processed`);
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
  fieldsToStrip,
  buildRemoveExpression,
  KEEP_FIELDS,
};
