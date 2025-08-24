import { DYNAMO_TABLES } from '../../../lib/constants';
import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { scanTable } from '../../../lib/dynamo';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const cacheKey = generateCacheKey('books');
    
    const books = await withApiCache(cacheKey, async () => {
      return await scanTable(DYNAMO_TABLES.BOOK_RATINGS_TABLE);
    });

    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
}