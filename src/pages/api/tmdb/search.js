import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapTmdbResult } from '../../../lib/tmdb';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`tmdb-search:${getClientIp(req)}`, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many requests — please wait a moment and try again.' });
  }

  const { query, type } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'query parameter is required' });
  }

  if (!type || !['movie', 'tv'].includes(type)) {
    return res.status(400).json({ message: 'type must be "movie" or "tv"' });
  }

  const token = process.env.TMDB_API_TOKEN;
  if (!token) {
    return res.status(500).json({ message: 'TMDB_API_TOKEN not configured' });
  }

  try {
    const cacheKey = generateCacheKey('tmdb-search', { query, type });

    const results = await withApiCache(cacheKey, async () => {
      const url = new URL(`https://api.themoviedb.org/3/search/${type}`);
      url.searchParams.set('query', query);
      url.searchParams.set('include_adult', 'false');
      url.searchParams.set('language', 'en-US');
      url.searchParams.set('page', '1');

      console.log(`🎬 [TMDB] Searching ${type}: "${query}"`);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      const data = await response.json();
      const rawResults = data.results ?? [];

      return rawResults.map(raw => mapTmdbResult(raw, type));
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('❌ [TMDB] Search error:', error);
    return res.status(500).json({ message: 'Error searching TMDB', error: error.message });
  }
}
