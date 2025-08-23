import { DYNAMO_TABLES, SERVER_CACHES } from '../../../lib/constants';
import cacheReadthrough from '../../../lib/cache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const books = await cacheReadthrough(
      SERVER_CACHES.BOOK_CACHE,
      'books',
      async () => scanTable(DYNAMO_TABLES.BOOK_RATINGS_TABLE)
    );

    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
}