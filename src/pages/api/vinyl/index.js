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
      
      // Sort by artist, then by title
      return collection.sort((a, b) => {
        const artistCompare = (a.artist || '').localeCompare(b.artist || '');
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