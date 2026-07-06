import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { scanTable } from '../../../lib/dynamo';
import { sortByDateDesc } from '../../../lib/hotTakes';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('hot-takes');

    const hotTakes = await withApiCache(cacheKey, async () => {
      const takes = await scanTable(DYNAMO_TABLES.HOT_TAKES_TABLE);
      return sortByDateDesc(takes);
    });

    res.status(200).json(hotTakes);
  } catch (error) {
    console.error('Error fetching hot takes:', error);
    res.status(500).json({ message: 'Error fetching hot takes' });
  }
}
