import { DYNAMO_TABLES, SERVER_CACHES } from '../../../lib/constants';
import cacheReadthrough from '../../../lib/cache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const movies = await cacheReadthrough(
      SERVER_CACHES.MOVIE_CACHE,
      'movies',
      async () => scanTable(DYNAMO_TABLES.MOVIE_RATINGS_TABLE)
    );

    res.status(200).json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
}