/**
 * Migration script to copy album review data from AlbumRatings to AlbumRatingsV2
 * This script ONLY reads from source table and creates new v2 table with 5-point rating scale
 *
 * Changes in v2:
 * - Albums: title, artist, rating (out of 5, halved from original 10), highlights, date
 *
 * Run with: node src/scripts/migrateAlbumsToV2.js
 */

const { DynamoDBClient, DescribeTableCommand, CreateTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

// Configure AWS
const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(client);

// Table configurations
const TABLES = {
  SOURCE: {
    ALBUMS: 'AlbumRatings'
  },
  TARGET: {
    ALBUMS: 'AlbumRatingsV2'
  }
};

async function scanTable(tableName) {
  console.log(`📖 Reading data from ${tableName}...`);

  const params = {
    TableName: tableName
  };

  const result = await dynamoDb.send(new ScanCommand(params));
  console.log(`✅ Found ${result.Items.length} items in ${tableName}`);
  return result.Items;
}

async function createTableIfNotExists(tableName, keySchema) {
  try {
    // Check if table exists
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`📋 Table ${tableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  // Create table
  console.log(`🔨 Creating table ${tableName}...`);

  const params = {
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: keySchema.map(key => ({
      AttributeName: key.AttributeName,
      AttributeType: 'S' // All our keys are strings
    })),
    BillingMode: 'PAY_PER_REQUEST'
  };

  await client.send(new CreateTableCommand(params));

  // Wait for table to be active
  await waitUntilTableExists(
    { client, maxWaitTime: 120 },
    { TableName: tableName }
  );
  console.log(`✅ Table ${tableName} created successfully`);
}

async function batchWriteItems(tableName, items) {
  console.log(`💾 Writing ${items.length} items to ${tableName}...`);

  // DynamoDB batch write limit is 25 items
  const batchSize = 25;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const params = {
      RequestItems: {
        [tableName]: batch.map(item => ({
          PutRequest: {
            Item: item
          }
        }))
      }
    };

    await dynamoDb.send(new BatchWriteCommand(params));
    console.log(`📝 Wrote batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
  }

  console.log(`✅ Successfully wrote all ${items.length} items to ${tableName}`);
}

function transformAlbumData(sourceAlbums) {
  return sourceAlbums.map(album => ({
    title: album.title,
    artist: album.artist,
    rating: Math.floor((album.rating || 0) / 2), // Convert from 10 to 5 scale (round down)
    highlights: album.highlights || '',
    date: album.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  }));
}

async function migrateAlbums() {
  console.log('\n🚀 Starting Albums migration...');

  // Create v2 table
  await createTableIfNotExists(TABLES.TARGET.ALBUMS, [
    { AttributeName: 'title', KeyType: 'HASH' },
    { AttributeName: 'artist', KeyType: 'RANGE' }
  ]);

  // Read source data
  const sourceAlbums = await scanTable(TABLES.SOURCE.ALBUMS);

  // Transform data
  const transformedAlbums = transformAlbumData(sourceAlbums);
  console.log(`🔄 Transformed ${transformedAlbums.length} album records`);

  // Write to v2 table
  if (transformedAlbums.length > 0) {
    await batchWriteItems(TABLES.TARGET.ALBUMS, transformedAlbums);
  }

  console.log('✅ Albums migration completed');
}

async function main() {
  console.log('🎵 Starting Album Reviews Migration to V2 Table');
  console.log('⚠️  This script only READS from source table and CREATES new v2 table');
  console.log('⚠️  No existing data will be modified or deleted\n');

  try {
    await migrateAlbums();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created: ${TABLES.TARGET.ALBUMS}`);
    console.log('\n✨ All album ratings converted from 10-point to 5-point scale (halved and rounded down)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = {
  main,
  migrateAlbums
};
