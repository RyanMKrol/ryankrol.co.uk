/**
 * Normalise a single Hardcover search result's document into the common book-result shape.
 * @param {Object} hit - Raw hit.document from Hardcover GraphQL search response
 * @returns {{ source, volumeId, title, authors, firstPublishedYear, coverUrl, isbn, subjects, pageCount, publisher }}
 */
export function mapHardcoverResult(hit) {
  if (!hit || !hit.document) {
    return {
      source: 'hardcover',
      volumeId: null,
      title: null,
      authors: [],
      firstPublishedYear: null,
      coverUrl: null,
      isbn: [],
      subjects: [],
      pageCount: null,
      publisher: [],
    };
  }

  const doc = hit.document;

  const coverUrl = (doc.image && doc.image.url) ? doc.image.url : null;

  const firstPublishedYear =
    typeof doc.release_year === 'number' ? doc.release_year : null;

  const isbn = Array.isArray(doc.isbns) ? doc.isbns : [];

  const subjects = Array.isArray(doc.genres) ? doc.genres : [];

  const pageCount = typeof doc.pages === 'number' ? doc.pages : null;

  return {
    source: 'hardcover',
    volumeId: doc.id ?? null,
    title: doc.title ?? null,
    authors: Array.isArray(doc.author_names) ? doc.author_names : [],
    firstPublishedYear,
    coverUrl,
    isbn,
    subjects,
    pageCount,
    publisher: [],
  };
}

/**
 * Map a Hardcover book details response to extracted enrichment fields.
 * Only includes fields that are present in the response; omits null/undefined fields.
 * @param {Object} book - Raw book object from Hardcover GraphQL `books` query
 * @returns {{ hardcoverSynopsis?, hardcoverSlug?, hardcoverRating?, seriesName?, seriesPosition? }}
 */
export function mapHardcoverDetails(book) {
  const result = {};

  if (book.description && typeof book.description === 'string' && book.description.trim()) {
    result.hardcoverSynopsis = book.description.trim();
  }

  if (book.slug && typeof book.slug === 'string' && book.slug.trim()) {
    result.hardcoverSlug = book.slug.trim();
  }

  if (typeof book.rating === 'number') {
    result.hardcoverRating = book.rating;
  }

  if (book.book_series && Array.isArray(book.book_series) && book.book_series.length > 0) {
    const series = book.book_series[0];
    if (series.series && series.series.name && typeof series.series.name === 'string' && series.series.name.trim()) {
      result.seriesName = series.series.name.trim();
    }
    if (typeof series.position === 'number') {
      result.seriesPosition = series.position;
    }
  }

  return result;
}

/**
 * Fetch enriched book details from Hardcover GraphQL API by book id.
 * @param {string} bookId - Hardcover book id (from search result)
 * @returns {Promise<{ hardcoverSynopsis?, hardcoverSlug?, hardcoverRating?, seriesName?, seriesPosition? }>}
 */
export async function fetchHardcoverBookDetails(bookId) {
  if (!bookId || typeof bookId !== 'string') {
    return {};
  }

  const token = process.env.HARDCOVER_API_TOKEN;
  if (!token) {
    console.warn('⚠️ HARDCOVER_API_TOKEN not set, skipping book details fetch');
    return {};
  }

  const query = `
    query BookDetails($id: String!) {
      books(where: { id: { _eq: $id } }) {
        id
        description
        slug
        rating
        book_series {
          position
          series {
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { id: bookId },
      }),
    });

    if (!response.ok) {
      console.error(`🔴 Hardcover API error (${response.status}):`, response.statusText);
      return {};
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error('🔴 Hardcover GraphQL errors:', data.errors);
      return {};
    }

    if (!data.data || !data.data.books || data.data.books.length === 0) {
      console.log('ℹ️ Hardcover book not found for id:', bookId);
      return {};
    }

    const book = data.data.books[0];
    const details = mapHardcoverDetails(book);

    if (Object.keys(details).length > 0) {
      console.log('✅ Fetched Hardcover book details:', Object.keys(details).join(', '));
    }

    return details;
  } catch (error) {
    console.error('🔴 Error fetching Hardcover book details:', error.message);
    return {};
  }
}
