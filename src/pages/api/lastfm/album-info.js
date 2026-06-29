import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapAlbumInfo } from '../../../lib/lastfm';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { artist, album, mbid } = req.query;

  const apiKey = process.env.LAST_FM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'LAST_FM_API_KEY not configured' });
  }

  if (!mbid && (!artist || !album)) {
    return res.status(400).json({ message: 'Provide mbid, or both artist and album' });
  }

  try {
    const cacheKey = generateCacheKey('lastfm-album-info', { artist, album, mbid });

    const info = await withApiCache(cacheKey, async () => {
      const url = new URL('https://ws.audioscrobbler.com/2.0/');
      url.searchParams.set('method', 'album.getInfo');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('format', 'json');

      if (mbid) {
        url.searchParams.set('mbid', mbid);
      } else {
        url.searchParams.set('artist', artist);
        url.searchParams.set('album', album);
      }

      console.log(`🎵 [Last.fm] Album info: ${mbid ? `mbid=${mbid}` : `${artist} — ${album}`}`);
      const start = Date.now();

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [Last.fm] Album info done in ${Date.now() - start}ms`);

      if (!data.album) {
        throw new Error('Album not found');
      }

      return mapAlbumInfo(data.album);
    });

    return res.status(200).json({ info });
  } catch (error) {
    console.error('❌ [Last.fm] Album info error:', error);
    return res.status(500).json({ message: 'Error fetching album info', error: error.message });
  }
}
