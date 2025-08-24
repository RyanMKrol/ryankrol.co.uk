import { withApiCache, generateCacheKey } from '../../../lib/apiCache';

// 4 hour cache for Last.fm top albums data
const FOUR_HOURS = 4 * 60 * 60;

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

    const { period = '3month', limit = '50' } = req.query;
    const cacheKey = generateCacheKey('lastfm-top-albums', { period, limit });
    
    const topAlbums = await withApiCache(cacheKey, async () => {
      // Get both top albums and top tracks to filter out single-song albums
      const albumsUrl = new URL('https://ws.audioscrobbler.com/2.0/');
      albumsUrl.searchParams.append('method', 'user.getTopAlbums');
      albumsUrl.searchParams.append('user', LAST_FM_USERNAME);
      albumsUrl.searchParams.append('api_key', LAST_FM_API_KEY);
      albumsUrl.searchParams.append('format', 'json');
      albumsUrl.searchParams.append('period', period);
      albumsUrl.searchParams.append('limit', limit);

      const tracksUrl = new URL('https://ws.audioscrobbler.com/2.0/');
      tracksUrl.searchParams.append('method', 'user.getTopTracks');
      tracksUrl.searchParams.append('user', LAST_FM_USERNAME);
      tracksUrl.searchParams.append('api_key', LAST_FM_API_KEY);
      tracksUrl.searchParams.append('format', 'json');
      tracksUrl.searchParams.append('period', period);
      tracksUrl.searchParams.append('limit', '200'); // Get more tracks to analyze

      // Fetch both albums and tracks in parallel
      const [albumsResponse, tracksResponse] = await Promise.all([
        fetch(albumsUrl.toString()),
        fetch(tracksUrl.toString())
      ]);

      if (!albumsResponse.ok || !tracksResponse.ok) {
        throw new Error(`Last.fm API error: ${albumsResponse.status} / ${tracksResponse.status}`);
      }

      const [albumsData, tracksData] = await Promise.all([
        albumsResponse.json(),
        tracksResponse.json()
      ]);
      
      if (!albumsData.topalbums || !albumsData.topalbums.album) {
        return { albums: [], totalPages: 0, page: 1, total: 0 };
      }

      const albums = Array.isArray(albumsData.topalbums.album) ? albumsData.topalbums.album : [albumsData.topalbums.album];
      const tracks = (tracksData.toptracks && tracksData.toptracks.track) 
        ? (Array.isArray(tracksData.toptracks.track) ? tracksData.toptracks.track : [tracksData.toptracks.track])
        : [];

      // Create a map of artist+album -> total track plays for filtering
      const albumTrackPlays = new Map();
      tracks.forEach(track => {
        const artist = track.artist.name || track.artist;
        const album = track.album?.['#text'] || '';
        if (album) {
          const key = `${artist}::${album}`;
          const plays = parseInt(track.playcount);
          albumTrackPlays.set(key, (albumTrackPlays.get(key) || 0) + plays);
        }
      });

      // Filter albums where a single track represents more than 70% of total album plays
      const filteredAlbums = albums.filter(album => {
        const albumKey = `${album.artist.name}::${album.name}`;
        const totalTrackPlays = albumTrackPlays.get(albumKey) || 0;
        const albumPlays = parseInt(album.playcount);
        
        // If we have track data and tracks make up more than 70% of album plays, filter it out
        if (totalTrackPlays > 0) {
          const trackRatio = totalTrackPlays / albumPlays;
          return trackRatio < 0.7; // Keep albums where tracks are less than 70% of total plays
        }
        
        // Keep albums where we don't have track data
        return true;
      });
      
      return {
        albums: filteredAlbums.map(album => ({
          name: album.name,
          artist: album.artist.name,
          playcount: parseInt(album.playcount),
          url: album.url,
          image: album.image && album.image.length > 0 
            ? album.image.find(img => img.size === 'large' || img.size === 'extralarge')?.['#text'] 
              || album.image[album.image.length - 1]['#text']
            : null,
          rank: parseInt(album['@attr']?.rank || 0)
        })),
        totalPages: parseInt(albumsData.topalbums['@attr']?.totalPages || 1),
        page: parseInt(albumsData.topalbums['@attr']?.page || 1),
        total: parseInt(albumsData.topalbums['@attr']?.total || filteredAlbums.length),
        period
      };
    }, FOUR_HOURS);

    res.status(200).json(topAlbums);
  } catch (error) {
    console.error('Error fetching Last.fm top albums:', error);
    res.status(500).json({ 
      message: 'Error fetching top albums',
      error: error.message 
    });
  }
}