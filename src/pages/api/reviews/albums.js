import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('albums');
    
    const albums = await withApiCache(cacheKey, async () => {
      return await scanTable(DYNAMO_TABLES.ALBUM_RATINGS_TABLE);
    });

    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ message: 'Error fetching albums' });
  }
}