/**
 * Migration script to copy vinyl collection data from VinylCollection (keyed on title+artist)
 * into a new VinylCollectionV2 table keyed on a synthetic `id` (String, HASH).
 * This script ONLY reads from the source table and writes into the new v2 table —
 * VinylCollection is never modified or deleted.
 *
 * Run with: node src/scripts/migrateVinylToIdTable.js
 * Verify only: node src/scripts/migrateVinylToIdTable.js --verify
 * Force re-migration over a non-empty target table: node src/scripts/migrateVinylToIdTable.js --force
 */

const { randomUUID } = require('crypto');
const { DynamoDBClient, DescribeTableCommand, CreateTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

const TABLES = {
  SOURCE: 'VinylCollection',
  TARGET: 'VinylCollectionV2',
};

async function scanAllItems(tableName) {
  console.log(`💿 Reading data from ${tableName}...`);

  const items = [];
  let ExclusiveStartKey;

  do {
    const result = await dynamoDb.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey,
    }));
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  console.log(`✅ Found ${items.length} items in ${tableName}`);
  return items;
}

async function createTableIfNotExists(tableName, keySchema) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`📋 Table ${tableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  console.log(`🔨 Creating table ${tableName}...`);

  const params = {
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: keySchema.map((key) => ({
      AttributeName: key.AttributeName,
      AttributeType: 'S',
    })),
    BillingMode: 'PAY_PER_REQUEST',
  };

  await client.send(new CreateTableCommand(params));

  await waitUntilTableExists(
    { client, maxWaitTime: 120 },
    { TableName: tableName }
  );
  console.log(`✅ Table ${tableName} created successfully`);
}

async function batchWriteItems(tableName, items) {
  console.log(`💾 Writing ${items.length} items to ${tableName}...`);

  const batchSize = 25;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const params = {
      RequestItems: {
        [tableName]: batch.map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    };

    await dynamoDb.send(new BatchWriteCommand(params));
    console.log(`📝 Wrote batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
  }

  console.log(`✅ Successfully wrote all ${items.length} items to ${tableName}`);
}

/**
 * Pure transform: copy every field from the old item unchanged (including the
 * nested `lastfm` object) and append a freshly generated `id`. No renaming/
 * dropping/transforming of existing fields — title and artist become ordinary
 * non-key attributes on the new table.
 */
function buildMigratedItem(oldItem) {
  return {
    ...oldItem,
    id: randomUUID(),
  };
}

function buildMigratedItems(oldItems) {
  return oldItems.map(buildMigratedItem);
}

/**
 * Pure comparison: diff an old item against its migrated counterpart, ignoring
 * the new `id` field. Returns an array of { field, oldValue, newValue } mismatches
 * (empty array = clean match).
 */
function diffMigratedItem(oldItem, newItem) {
  if (!newItem) {
    return [{ field: '<missing>', oldValue: oldItem, newValue: undefined }];
  }

  const mismatches = [];
  const fields = new Set([...Object.keys(oldItem), ...Object.keys(newItem).filter((f) => f !== 'id')]);

  for (const field of fields) {
    const oldValue = oldItem[field];
    const newValue = newItem[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      mismatches.push({ field, oldValue, newValue });
    }
  }

  return mismatches;
}

function findMatchingNewItem(oldItem, newItems) {
  return newItems.find((newItem) => newItem.title === oldItem.title && newItem.artist === oldItem.artist);
}

async function runVerify() {
  console.log('\n🔍 Verifying migration...');

  const oldItems = await scanAllItems(TABLES.SOURCE);
  const newItems = await scanAllItems(TABLES.TARGET);

  let mismatchCount = 0;

  for (const oldItem of oldItems) {
    const newItem = findMatchingNewItem(oldItem, newItems);
    const mismatches = diffMigratedItem(oldItem, newItem);

    if (mismatches.length > 0) {
      mismatchCount += 1;
      console.error(`❌ Mismatch for "${oldItem.title}" by "${oldItem.artist}":`);
      for (const { field, oldValue, newValue } of mismatches) {
        console.error(`   - ${field}: old=${JSON.stringify(oldValue)} new=${JSON.stringify(newValue)}`);
      }
    }
  }

  console.log(`\n📊 Old count: ${oldItems.length}, New count: ${newItems.length}`);

  if (mismatchCount === 0 && oldItems.length === newItems.length) {
    console.log('VERIFY: PASS');
    return true;
  }

  console.log(`VERIFY: FAIL (${mismatchCount} mismatches)`);
  return false;
}

async function runMigration({ force }) {
  console.log('\n🚀 Starting Vinyl-to-id-table migration...');

  await createTableIfNotExists(TABLES.TARGET, [
    { AttributeName: 'id', KeyType: 'HASH' },
  ]);

  const existingTargetItems = await scanAllItems(TABLES.TARGET);
  if (existingTargetItems.length > 0 && !force) {
    console.error(`⚠️  ${TABLES.TARGET} already has ${existingTargetItems.length} items — aborting to avoid double-migration. Pass --force to override.`);
    process.exit(1);
  }

  const oldItems = await scanAllItems(TABLES.SOURCE);
  const newItems = buildMigratedItems(oldItems);
  console.log(`🔄 Transformed ${newItems.length} vinyl records`);

  if (newItems.length > 0) {
    await batchWriteItems(TABLES.TARGET, newItems);
  }

  console.log('✅ Vinyl migration completed');
  console.log(`\n📊 Summary: ${TABLES.SOURCE}=${oldItems.length} items, ${TABLES.TARGET}=${newItems.length} items written`);
}

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify');
  const force = args.includes('--force');

  console.log('💿 Starting Vinyl Collection Migration to id-keyed Table');
  console.log('⚠️  This script only READS from VinylCollection and writes to VinylCollectionV2');
  console.log('⚠️  VinylCollection will not be modified or deleted\n');

  try {
    if (verifyOnly) {
      const passed = await runVerify();
      process.exit(passed ? 0 : 1);
    }

    await runMigration({ force });
    const passed = await runVerify();
    process.exit(passed ? 0 : 1);
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
  buildMigratedItem,
  buildMigratedItems,
  diffMigratedItem,
  findMatchingNewItem,
};
