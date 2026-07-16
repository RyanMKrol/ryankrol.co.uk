/**
 * One-shot ops script: normalise "extra blank line" runs in stored review text.
 *
 * Background: before the Markdown renderer gave paragraphs real spacing, the only way to
 * force a visible gap was to type MULTIPLE blank lines (which `preserveBlankLines`/T382 turns
 * into gap paragraphs). Now that a single blank line already renders a gap, those old
 * multi-blank-line runs render as DOUBLED spacing. This script collapses any run of 2+
 * consecutive blank lines down to a single blank line (a normal paragraph break) and trims
 * leading/trailing blank lines — matching the inverse of what creates gap paragraphs, so
 * paragraph breaks survive and only the doubled spacing is removed.
 *
 * READ-ONLY BY DEFAULT (dry run — reports what WOULD change). Pass --apply to write.
 *
 *   node src/scripts/normalizeReviewNewlines.js            # dry run (audit only)
 *   node src/scripts/normalizeReviewNewlines.js --apply    # perform the updates
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const db = DynamoDBDocumentClient.from(client);

const APPLY = process.argv.includes('--apply');

// table -> the Markdown-rendered review-body field (all keyed by `id`).
const TARGETS = [
  { table: 'MovieRatingsV4', field: 'review_text', label: (i) => i.title },
  { table: 'TelevisionRatingsV4', field: 'review_text', label: (i) => i.title },
  { table: 'BookRatingsV4', field: 'review_text', label: (i) => `${i.title}${i.author ? ` — ${i.author}` : ''}` },
  { table: 'AlbumRatingsV3', field: 'highlights', label: (i) => `${i.title}${i.artist ? ` — ${i.artist}` : ''}` },
  { table: 'PerfumeRatings', field: 'description', label: (i) => `${i.title}${i.designer ? ` — ${i.designer}` : ''}` },
  { table: 'HotTakes', field: 'text', label: (i) => (i.text || '').replace(/\s+/g, ' ').slice(0, 50) },
];

// A run of 2+ consecutive blank (whitespace-only) lines is what renders as extra gap paragraphs.
function hasExtraBlankRun(s) {
  if (typeof s !== 'string') return false;
  const lines = s.split('\n');
  let run = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      run += 1;
      if (run >= 2) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

// Collapse runs of 2+ blank lines to a single blank line; drop leading/trailing blank lines.
// Keeps single blank lines (paragraph breaks) intact.
function normalize(s) {
  const lines = s.split('\n');
  const out = [];
  let blankRun = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      blankRun += 1;
    } else {
      if (blankRun > 0 && out.length > 0) out.push('');
      blankRun = 0;
      out.push(line);
    }
  }
  return out.join('\n');
}

const vis = (s) => JSON.stringify(s); // show \n explicitly in output

async function scanAll(table) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await db.send(new ScanCommand({ TableName: table, ExclusiveStartKey }));
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function main() {
  console.log(`\n=== normalizeReviewNewlines — ${APPLY ? '🔴 APPLY (writing)' : '🟢 DRY RUN (read-only)'} ===\n`);
  let totalAffected = 0;

  for (const { table, field, label } of TARGETS) {
    const items = await scanAll(table);
    const affected = items.filter((i) => hasExtraBlankRun(i[field]));
    console.log(`\n📋 ${table}.${field} — ${items.length} rows scanned, ${affected.length} with extra blank runs`);

    for (const item of affected) {
      const before = item[field];
      const after = normalize(before);
      totalAffected += 1;
      console.log(`  • ${label(item) || '(untitled)'}  [id=${item.id}]`);
      console.log(`      before: ${vis(before)}`);
      console.log(`      after:  ${vis(after)}`);

      if (APPLY) {
        await db.send(new UpdateCommand({
          TableName: table,
          Key: { id: item.id },
          UpdateExpression: 'SET #f = :v',
          ExpressionAttributeNames: { '#f': field },
          ExpressionAttributeValues: { ':v': after },
        }));
        console.log('      ✅ updated');
      }
    }
  }

  // TopOfMind is the /tom note — Markdown-rendered too. Report only (owner edits it via /tom).
  try {
    const tom = await scanAll('TopOfMind');
    const tomHits = tom.filter((i) => hasExtraBlankRun(i.text));
    if (tomHits.length) {
      console.log(`\n📌 TopOfMind — ${tomHits.length} note(s) with extra blank runs (report only; edit via /tom):`);
      tomHits.forEach((i) => console.log(`      ${vis(i.text)}`));
    }
  } catch (e) {
    console.log(`\n(TopOfMind check skipped: ${e.message})`);
  }

  console.log(`\n=== ${totalAffected} review row(s) ${APPLY ? 'updated' : 'would be updated'} ===`);
  if (!APPLY && totalAffected > 0) console.log('Re-run with --apply to write these changes.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
