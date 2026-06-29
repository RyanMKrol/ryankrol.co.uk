import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapBookResult } from '../../../lib/openlibrary';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, author, query } = req.query;

  if (!title && !query) {
    return res.status(400).json({ message: 'title parameter is required' });
  }

  try {
    const cacheKey = title
      ? generateCacheKey('book-search', { title, author })
      : generateCacheKey('book-search', { query });

    const results = await withApiCache(cacheKey, async () => {
      const url = new URL('https://openlibrary.org/search.json');

      if (title) {
        url.searchParams.set('title', title);
        if (author) url.searchParams.set('author', author);
        console.log(`📚 [OpenLibrary] Searching books: title="${title}"${author ? ` author="${author}"` : ''}`);
      } else {
        url.searchParams.set('q', query);
        console.log(`📚 [OpenLibrary] Searching books: "${query}"`);
      }

      url.searchParams.set('limit', '20');

      const response = await fetch(url.toString(), {
        headers: { accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status}`);
      }

      const data = await response.json();
      const docs = data.docs ?? [];

      return docs.map(mapBookResult);
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('❌ [OpenLibrary] Search error:', error);
    return res.status(500).json({ message: 'Error searching Open Library', error: error.message });
  }
}
