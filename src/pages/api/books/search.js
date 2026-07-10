import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapHardcoverResult } from '../../../lib/hardcover';
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

    const results = await withApiCache(cacheKey, () => searchHardcover(title, author));

    return res.status(200).json(results);
  } catch (error) {
    // If upstream returned 429, propagate it with a Retry-After header
    if (error.message.includes('429')) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ message: 'Hardcover API rate limited — please retry after a moment' });
    }

    console.error('❌ [Books] Search error:', error);
    return res.status(500).json({ message: 'Error searching books', error: error.message });
  }
}

async function searchHardcover(title, author) {
  const query = `${title}${author ? ` ${author}` : ''}`.trim();

  const graphqlQuery = `
    query Search($q: String!) {
      search(query: $q, query_type: "Book", per_page: 20) {
        results {
          hits {
            document {
              id
              title
              author_names
              release_year
              image {
                url
              }
              isbns
              genres
              pages
            }
          }
        }
      }
    }
  `;

  const token = process.env.HARDCOVER_API_TOKEN;
  if (!token) {
    console.warn('⚠️ [Hardcover] HARDCOVER_API_TOKEN not set — requests will fail');
  }

  console.log(`📚 [Hardcover] Searching books: query="${query}"`);

  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { q: query },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const bodySnippet = body.slice(0, 300);
    const diagnostics = `status=${response.status} statusText="${response.statusText}" body="${bodySnippet}" query="${query}"`;
    console.error(`❌ [Hardcover] API error — ${diagnostics}`);

    // Propagate 429 upstream to the client so backfill retry logic can trigger
    if (response.status === 429) {
      throw new Error(`Hardcover API 429 — rate limited`);
    }

    throw new Error(`Hardcover API error: ${response.status}`);
  }

  const data = await response.json();

  // Check for GraphQL errors
  if (data.errors) {
    console.error(`❌ [Hardcover] GraphQL error — ${JSON.stringify(data.errors)}`);
    throw new Error(`Hardcover GraphQL error`);
  }

  const hits = data.data?.search?.results?.hits ?? [];

  return hits.map(mapHardcoverResult);
}
