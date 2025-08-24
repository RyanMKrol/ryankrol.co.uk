import { withApiCache, generateCacheKey } from '../../../lib/apiCache';

// 5 minute cache for Last.fm data
const FIVE_MINUTES = 5 * 60;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
    const LAST_FM_USERNAME = process.env.LAST_FM_USERNAME;
    
    if (!LAST_FM_API_KEY || !LAST_FM_USERNAME) {
      return res.status(500).json({ 
        message: 'Last.fm credentials not configured',
        error: 'Missing LAST_FM_API_KEY or LAST_FM_USERNAME environment variables'
      });
    }

    const cacheKey = generateCacheKey('lastfm-now-playing');
    
    const currentTrack = await withApiCache(cacheKey, async () => {
      // Get recent tracks from Last.fm
      const lastFmUrl = new URL('https://ws.audioscrobbler.com/2.0/');
      lastFmUrl.searchParams.append('method', 'user.getrecenttracks');
      lastFmUrl.searchParams.append('user', LAST_FM_USERNAME);
      lastFmUrl.searchParams.append('api_key', LAST_FM_API_KEY);
      lastFmUrl.searchParams.append('format', 'json');
      lastFmUrl.searchParams.append('limit', '1');

      const response = await fetch(lastFmUrl.toString());

      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.recenttracks || !data.recenttracks.track || !data.recenttracks.track[0]) {
        return { isPlaying: false };
      }

      const track = data.recenttracks.track[0];
      const isCurrentlyPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

      if (!isCurrentlyPlaying) {
        return { isPlaying: false };
      }

      return {
        isPlaying: true,
        track: {
          name: track.name,
          artist: track.artist['#text'] || track.artist,
          album: track.album['#text'] || track.album,
          albumArt: track.image && track.image.length > 0 
            ? track.image.find(img => img.size === 'large' || img.size === 'extralarge')?.['#text'] 
              || track.image[track.image.length - 1]['#text']
            : null,
          lastFmUrl: track.url,
          timestamp: track.date ? track.date.uts : null
        }
      };
    }, FIVE_MINUTES);

    res.status(200).json(currentTrack);
  } catch (error) {
    console.error('Error fetching Last.fm now playing:', error);
    res.status(500).json({ 
      message: 'Error fetching currently playing track',
      error: error.message 
    });
  }
}