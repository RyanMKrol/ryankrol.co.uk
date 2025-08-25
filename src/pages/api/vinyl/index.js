import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('vinyl-collection');
    
    const vinylCollection = await withApiCache(cacheKey, async () => {
      const collection = await scanTable(DYNAMO_TABLES.VINYL_COLLECTION_TABLE);
      
      // Sort by artist (ignoring "The"), then by title
      return collection.sort((a, b) => {
        const getArtistForSorting = (artist) => {
          if (!artist) return '';
          return artist.replace(/^The\s+/i, '').trim();
        };
        
        const artistA = getArtistForSorting(a.artist);
        const artistB = getArtistForSorting(b.artist);
        
        const artistCompare = artistA.localeCompare(artistB);
        if (artistCompare !== 0) return artistCompare;
        return (a.title || '').localeCompare(b.title || '');
      });
    });

    res.status(200).json(vinylCollection);
  } catch (error) {
    console.error('Error fetching vinyl collection:', error);
    res.status(500).json({ message: 'Error fetching vinyl collection' });
  }
}