import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapGoogleBooksResult } from '../../../lib/googlebooks';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`book-search:${getClientIp(req)}`, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many requests — please wait a moment and try again.' });
  }

  const { title, author } = req.query;

  if (!title) {
    return res.status(400).json({ message: 'title parameter is required' });
  }

  try {
    const cacheKey = generateCacheKey('book-search', { title, author });

    const results = await withApiCache(cacheKey, () => searchGoogleBooks(title, author));

    return res.status(200).json(results);
  } catch (error) {
    // If upstream returned 429, propagate it with a Retry-After header
    if (error.message.includes('429')) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ message: 'Google Books API rate limited — please retry after a moment' });
    }

    console.error('❌ [Books] Search error:', error);
    return res.status(500).json({ message: 'Error searching books', error: error.message });
  }
}

async function searchGoogleBooks(title, author) {
  let q = `intitle:${title}`;
  if (author) q += ` inauthor:${author}`;

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '20');

  // Without a key, Google buckets all requests by source IP into a shared anonymous
  // quota that is perpetually exhausted from datacenter IPs (Vercel) → 429s in prod.
  // A key bills against our own per-project quota instead.
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) {
    url.searchParams.set('key', apiKey);
  } else {
    console.warn('⚠️ [GoogleBooks] GOOGLE_BOOKS_API_KEY not set — using shared anonymous quota, expect 429s in production');
  }

  console.log(`📚 [GoogleBooks] Searching books: title="${title}"${author ? ` author="${author}"` : ''}`);

  const response = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const bodySnippet = body.slice(0, 300);
    const diagnostics = `status=${response.status} statusText="${response.statusText}" body="${bodySnippet}" query_title="${title}" query_author="${author || 'N/A'}"`;
    console.error(`❌ [GoogleBooks] API error — ${diagnostics}`);

    // Propagate 429 upstream to the client so backfill retry logic can trigger
    if (response.status === 429) {
      throw new Error(`Google Books API 429 — rate limited`);
    }

    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items ?? [];

  return items.map(mapGoogleBooksResult);
}
