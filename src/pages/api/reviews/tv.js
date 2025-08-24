import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('tv');
    
    const tvShows = await withApiCache(cacheKey, async () => {
      return await scanTable(DYNAMO_TABLES.TV_RATINGS_TABLE);
    });

    res.status(200).json(tvShows);
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    res.status(500).json({ message: 'Error fetching TV shows' });
  }
}