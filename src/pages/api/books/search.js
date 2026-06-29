import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { mapBookResult } from '../../../lib/openlibrary';
import { mapGoogleBooksResult } from '../../../lib/googlebooks';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, author, provider = 'openlibrary' } = req.query;

  if (!title) {
    return res.status(400).json({ message: 'title parameter is required' });
  }

  try {
    const cacheKey = generateCacheKey('book-search', { provider, title, author });

    const results = await withApiCache(cacheKey, async () => {
      if (provider === 'googlebooks') {
        return searchGoogleBooks(title, author);
      }
      return searchOpenLibrary(title, author);
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('❌ [Books] Search error:', error);
    return res.status(500).json({ message: 'Error searching books', error: error.message });
  }
}

async function searchOpenLibrary(title, author) {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('title', title);
  if (author) url.searchParams.set('author', author);
  url.searchParams.set('limit', '20');

  console.log(`📚 [OpenLibrary] Searching books: title="${title}"${author ? ` author="${author}"` : ''}`);

  const response = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Open Library API error: ${response.status}`);
  }

  const data = await response.json();
  const docs = data.docs ?? [];

  return docs.map((doc) => ({ source: 'openlibrary', ...mapBookResult(doc) }));
}

async function searchGoogleBooks(title, author) {
  let q = `intitle:${title}`;
  if (author) q += `+inauthor:${author}`;

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '20');

  console.log(`📚 [GoogleBooks] Searching books: title="${title}"${author ? ` author="${author}"` : ''}`);

  const response = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items ?? [];

  return items.map(mapGoogleBooksResult);
}
