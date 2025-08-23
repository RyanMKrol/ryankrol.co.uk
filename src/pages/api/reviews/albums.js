import { DYNAMO_TABLES, SERVER_CACHES } from '../../../lib/constants';
import cacheReadthrough from '../../../lib/cache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const albums = await cacheReadthrough(
      SERVER_CACHES.ALBUM_CACHE,
      'albums',
      async () => scanTable(DYNAMO_TABLES.ALBUM_RATINGS_TABLE)
    );

    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ message: 'Error fetching albums' });
  }
}