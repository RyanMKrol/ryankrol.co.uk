/**
 * Migration script: re-fetch Open-Library-sourced book reviews from Google Books.
 *
 * Updates records in BookRatingsV3 IN PLACE — for every review with source === 'openlibrary',
 * search Google Books by title+author and, on a confident match, replace the source-metadata
 * fields (never title/author/rating/overview) and drop the openlibrary-only fields (olid/coverId).
 *
 * DRY RUN BY DEFAULT — prints what it would change, writes nothing.
 * Run for real with: LIVE=1 node src/scripts/migrateOpenLibraryBooksToGoogleBooks.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const TABLE_NAME = 'BookRatingsV3';
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
 * Normalise a title for loose comparison (lowercase, strip punctuation/whitespace).
 */
function normaliseTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Pick a confident single top match from a list of Google Books search results
 * (already normalised via mapGoogleBooksResult), or null if none is confident enough.
 * A match is confident when the top result's normalised title equals the review's
 * normalised title.
 */
function findConfidentMatch(reviewTitle, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const target = normaliseTitle(reviewTitle);
  const top = candidates[0];

  if (normaliseTitle(top.title) === target) {
    return top;
  }

  return null;
}

/**
 * Compute the field updates to apply to a book review record, given a confident
 * Google Books match. Only ever touches source-metadata fields.
 */
function computeUpdateFields(match) {
  return {
    source: 'googlebooks',
    volumeId: match.volumeId,
    coverUrl: match.coverUrl,
    bookAuthors: match.authors,
    firstPublishedYear: match.firstPublishedYear,
    isbn: match.isbn,
    subjects: match.subjects,
    pageCount: match.pageCount,
    publisher: match.publisher,
  };
}

async function scanOpenLibraryReviews() {
  console.log(`📖 Scanning ${TABLE_NAME} for source === 'openlibrary' reviews...`);

  const result = await dynamoDb.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (result.Items || []).filter((item) => item.source === 'openlibrary');

  console.log(`✅ Found ${items.length} openlibrary-sourced review(s)`);
  return items;
}

async function searchGoogleBooks(title, author) {
  const { mapGoogleBooksResult } = require('../lib/googlebooks');

  let q = `intitle:${title}`;
  if (author) q += ` inauthor:${author}`;

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '20');

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    url.searchParams.set('key', apiKey);
  }

  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items ?? [];

  return items.map(mapGoogleBooksResult);
}

async function updateReview(review, fields) {
  const updateExpression = Object.keys(fields)
    .map((key) => `#${key} = :${key}`)
    .join(', ');
  const removeExpression = ['olid', 'coverId'].map((key) => `#${key}`).join(', ');

  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(fields).forEach((key) => {
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = fields[key];
  });
  expressionAttributeNames['#olid'] = 'olid';
  expressionAttributeNames['#coverId'] = 'coverId';

  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { title: review.title, author: review.author },
    UpdateExpression: `SET ${updateExpression} REMOVE ${removeExpression}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}

async function migrate() {
  console.log(`\n🚀 Starting Open Library → Google Books migration (${IS_LIVE ? 'LIVE' : 'DRY RUN'})`);
  if (!IS_LIVE) {
    console.log('⚠️  Dry run — no writes will be made. Set LIVE=1 to perform real updates.\n');
  }

  const reviews = await scanOpenLibraryReviews();

  let matched = 0;
  let skipped = 0;

  for (const review of reviews) {
    console.log(`\n📚 "${review.title}" by ${review.author}`);

    let candidates;
    try {
      candidates = await searchGoogleBooks(review.title, review.author);
    } catch (error) {
      console.error(`  ❌ Google Books search failed: ${error.message}`);
      skipped += 1;
      continue;
    }

    const match = findConfidentMatch(review.title, candidates);

    if (!match) {
      console.log('  ⚠️  no match — left as openlibrary');
      skipped += 1;
      continue;
    }

    const fields = computeUpdateFields(match);
    console.log(`  ✅ confident match: volumeId=${fields.volumeId}`);
    console.log(`  🔄 fields to update: ${JSON.stringify(fields)}`);

    if (IS_LIVE) {
      await updateReview(review, fields);
      console.log('  💾 updated');
    }

    matched += 1;
  }

  console.log(`\n🎉 Migration ${IS_LIVE ? 'completed' : 'dry run'} — matched: ${matched}, skipped: ${skipped}`);
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
  normaliseTitle,
  findConfidentMatch,
  computeUpdateFields,
};
