/**
 * Migration script: convert PerfumeRatings rows from the old considerTravelSize/
 * considerFullBottle booleans to the new ownership string field.
 *
 * DRY RUN BY DEFAULT — prints what it would change, writes nothing.
 * Run for real with: LIVE=1 node src/scripts/migratePerfumeOwnership.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const { DYNAMO_TABLES } = require('../lib/constants');

const TABLE_NAME = DYNAMO_TABLES.PERFUME_RATINGS_TABLE;
const IS_LIVE = process.env.LIVE === '1';

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

/**
 * Derive the new ownership value from a row's old considerTravelSize/considerFullBottle
 * booleans: full bottle > travel size > sample (default).
 */
function deriveOwnership(row) {
  if (row.considerFullBottle) return 'Full bottle';
  if (row.considerTravelSize) return 'Travel size';
  return 'Sample';
}

async function scanRowsToMigrate() {
  console.log(`🧴 Scanning ${TABLE_NAME} for rows still on the old ownership shape...`);

  const result = await dynamoDb.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (result.Items || []).filter(
    (item) => item.ownership === undefined
      && (item.considerTravelSize !== undefined || item.considerFullBottle !== undefined),
  );

  console.log(`✅ Found ${items.length} row(s) to migrate`);
  return items;
}

async function updateRow(row, ownership) {
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id: row.id },
    UpdateExpression: 'SET #ownership = :ownership REMOVE #considerTravelSize, #considerFullBottle',
    ExpressionAttributeNames: {
      '#ownership': 'ownership',
      '#considerTravelSize': 'considerTravelSize',
      '#considerFullBottle': 'considerFullBottle',
    },
    ExpressionAttributeValues: {
      ':ownership': ownership,
    },
  }));
}

async function migrate() {
  console.log(`\n🚀 Starting PerfumeRatings ownership migration (${IS_LIVE ? 'LIVE' : 'DRY RUN'})`);
  if (!IS_LIVE) {
    console.log('⚠️  Dry run — no writes will be made. Set LIVE=1 to perform real updates.\n');
  }

  const rows = await scanRowsToMigrate();

  for (const row of rows) {
    const ownership = deriveOwnership(row);
    console.log(`\n🧴 "${row.title || row.id}"`);
    console.log(`  considerTravelSize=${row.considerTravelSize} considerFullBottle=${row.considerFullBottle} → ownership=${ownership}`);

    if (IS_LIVE) {
      await updateRow(row, ownership);
      console.log('  💾 updated');
    }
  }

  console.log(`\n🎉 Migration ${IS_LIVE ? 'completed' : 'dry run'} — ${rows.length} row(s) processed`);
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
  deriveOwnership,
};
