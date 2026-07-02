import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapAlbumSearchResult } from '../../../lib/lastfm';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`lastfm-album-search:${getClientIp(req)}`, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many requests — please wait a moment and try again.' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(200).json({ results: [] });
  }

  const apiKey = process.env.LAST_FM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'LAST_FM_API_KEY not configured' });
  }

  try {
    const cacheKey = generateCacheKey('lastfm-album-search', { query });

    const results = await withApiCache(cacheKey, async () => {
      const url = new URL('https://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('method', 'album.search');
      url.searchParams.set('album', query);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '20');

      console.log(`🎵 [Last.fm] Album search: "${query}"`);
      const start = Date.now();

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [Last.fm] Album search done in ${Date.now() - start}ms`);

      const albums = data.results?.albummatches?.album;
      if (!albums) return [];
      const raw = Array.isArray(albums) ? albums : [albums];
      return raw.map(mapAlbumSearchResult);
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error('❌ [Last.fm] Album search error:', error);
    return res.status(500).json({ message: 'Error searching Last.fm', error: error.message });
  }
}
