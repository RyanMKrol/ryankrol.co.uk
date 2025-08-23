import { DYNAMO_TABLES, SERVER_CACHES } from '../../../lib/constants';
import cacheReadthrough from '../../../lib/cache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const tvShows = await cacheReadthrough(
      SERVER_CACHES.TV_CACHE,
      'tv',
      async () => scanTable(DYNAMO_TABLES.TV_RATINGS_TABLE)
    );

    res.status(200).json(tvShows);
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    res.status(500).json({ message: 'Error fetching TV shows' });
  }
}