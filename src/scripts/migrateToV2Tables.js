/**
 * Migration script to copy review data from existing tables to new v2 tables
 * This script ONLY reads from source tables and creates new v2 tables with simplified schema
 *
 * New schema:
 * - Books: title, author, rating (out of 5), review_text, date
 * - Movies: title, rating (out of 5), review_text, date
 * - TV: title, rating (out of 5), review_text, date
 *
 * Run with: node src/scripts/migrateToV2Tables.js
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
    BOOKS: 'BookRatings',
    MOVIES: 'MovieRatings',
    TV: 'TelevisionRatings'
  },
  TARGET: {
    BOOKS: 'BookRatingsV3',
    MOVIES: 'MovieRatingsV3',
    TV: 'TelevisionRatingsV3'
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

function transformBookData(sourceBooks) {
  return sourceBooks.map(book => ({
    title: book.title,
    author: book.author,
    rating: Math.floor((book.rating || 0) / 2), // Convert from 10 to 5 scale (round down)
    review_text: book.overview || '',
    date: book.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  }));
}

function transformMovieData(sourceMovies) {
  return sourceMovies.map(movie => ({
    title: movie.title,
    rating: Math.floor((movie.overallScore || 0) / 2), // Convert from 10 to 5 scale (round down)
    review_text: movie.gist || '',
    date: movie.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  }));
}

function transformTVData(sourceTVShows) {
  return sourceTVShows.map(tvShow => ({
    title: tvShow.title,
    rating: Math.floor((tvShow.overallScore || 0) / 2), // Convert from 10 to 5 scale (round down)
    review_text: tvShow.gist || '',
    date: tvShow.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  }));
}

async function migrateBooks() {
  console.log('\n🚀 Starting Books migration...');

  // Create v2 table
  await createTableIfNotExists(TABLES.TARGET.BOOKS, [
    { AttributeName: 'title', KeyType: 'HASH' },
    { AttributeName: 'author', KeyType: 'RANGE' }
  ]);

  // Read source data
  const sourceBooks = await scanTable(TABLES.SOURCE.BOOKS);

  // Transform data
  const transformedBooks = transformBookData(sourceBooks);
  console.log(`🔄 Transformed ${transformedBooks.length} book records`);

  // Write to v2 table
  if (transformedBooks.length > 0) {
    await batchWriteItems(TABLES.TARGET.BOOKS, transformedBooks);
  }

  console.log('✅ Books migration completed');
}

async function migrateMovies() {
  console.log('\n🚀 Starting Movies migration...');

  // Create v2 table
  await createTableIfNotExists(TABLES.TARGET.MOVIES, [
    { AttributeName: 'title', KeyType: 'HASH' }
  ]);

  // Read source data
  const sourceMovies = await scanTable(TABLES.SOURCE.MOVIES);

  // Transform data
  const transformedMovies = transformMovieData(sourceMovies);
  console.log(`🔄 Transformed ${transformedMovies.length} movie records`);

  // Write to v2 table
  if (transformedMovies.length > 0) {
    await batchWriteItems(TABLES.TARGET.MOVIES, transformedMovies);
  }

  console.log('✅ Movies migration completed');
}

async function migrateTV() {
  console.log('\n🚀 Starting TV Shows migration...');

  // Create v2 table
  await createTableIfNotExists(TABLES.TARGET.TV, [
    { AttributeName: 'title', KeyType: 'HASH' }
  ]);

  // Read source data
  const sourceTVShows = await scanTable(TABLES.SOURCE.TV);

  // Transform data
  const transformedTVShows = transformTVData(sourceTVShows);
  console.log(`🔄 Transformed ${transformedTVShows.length} TV show records`);

  // Write to v2 table
  if (transformedTVShows.length > 0) {
    await batchWriteItems(TABLES.TARGET.TV, transformedTVShows);
  }

  console.log('✅ TV Shows migration completed');
}

async function main() {
  console.log('🎬 Starting Review Data Migration to V2 Tables');
  console.log('⚠️  This script only READS from source tables and CREATES new v2 tables');
  console.log('⚠️  No existing data will be modified or deleted\n');

  try {
    await migrateBooks();
    await migrateMovies();
    await migrateTV();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created: ${TABLES.TARGET.BOOKS}`);
    console.log(`- Created: ${TABLES.TARGET.MOVIES}`);
    console.log(`- Created: ${TABLES.TARGET.TV}`);
    console.log('\n✨ All reviews converted to 5-star rating system');

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
  migrateBooks,
  migrateMovies,
  migrateTV
};
