/**
 * Migration script: remove legacy Google-Books/Open-Library-sourced metadata fields from
 * BookRatingsV4 now that Hardcover is the sole search provider. Clearing `volumeId`/`olid`
 * also flips needsBookBackfill(item) back to true (src/lib/backfillEligibility.js), making
 * these books newly eligible for a clean Hardcover-sourced re-backfill.
 *
 * DRY RUN BY DEFAULT — prints what it would change, writes nothing.
 * Run for real with: LIVE=1 node src/scripts/stripOldBookProviderMetadata.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { DYNAMO_TABLES } = require('../lib/constants');

// Fields populated by the retired Google-Books/Open-Library search paths. `olid`/`coverId` are
// the legacy Open-Library-era fields noted in root CLAUDE.md's Data model section.
const TARGET_FIELDS = [
  'source',
  'coverUrl',
  'volumeId',
  'bookAuthors',
  'firstPublishedYear',
  'isbn',
  'subjects',
  'pageCount',
  'publisher',
  'olid',
  'coverId',
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

/** Returns the subset of TARGET_FIELDS present on this row, i.e. what would be stripped. */
function fieldsToStrip(item) {
  return TARGET_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(item, field));
}

async function scanRowsToStrip(tableName) {
  const result = await dynamoDb.send(new ScanCommand({ TableName: tableName }));
  return (result.Items || [])
    .map((item) => ({ item, fields: fieldsToStrip(item) }))
    .filter(({ fields }) => fields.length > 0);
}

/**
 * Build a REMOVE UpdateExpression that aliases every attribute via ExpressionAttributeNames.
 * Aliasing is required because several target fields (e.g. `source`) are DynamoDB reserved
 * keywords and cannot appear literally in an UpdateExpression — a raw `REMOVE source` is
 * rejected with a ValidationException. Returns `{ UpdateExpression, ExpressionAttributeNames }`.
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
  console.log(`\n📼 Scanning ${tableName} for rows with old-provider metadata...`);
  const rows = await scanRowsToStrip(tableName);
  console.log(`✅ Found ${rows.length} row(s) to strip`);

  for (const { item, fields } of rows) {
    console.log(`  "${item.title || item.id}" — stripping: ${fields.join(', ')}`);
    if (IS_LIVE) {
      await stripRow(tableName, item, fields);
      console.log('    💾 stripped');
    }
  }

  return rows.length;
}

async function migrate() {
  console.log(`\n🚀 Starting old-provider metadata strip (${IS_LIVE ? 'LIVE' : 'DRY RUN'})`);
  if (!IS_LIVE) {
    console.log('⚠️  Dry run — no writes will be made. Set LIVE=1 to perform real updates.');
  }

  const total = await migrateTable(DYNAMO_TABLES.BOOK_RATINGS_TABLE);

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
  TARGET_FIELDS,
};
