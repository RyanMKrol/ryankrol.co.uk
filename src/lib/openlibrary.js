const COVER_BASE = 'https://covers.openlibrary.org/b/id';

/**
 * Build a cover image URL from an Open Library cover ID.
 * size: 'S' | 'M' | 'L'
 * Returns null if coverId is falsy.
 */
export function bookCoverUrl(coverId, size = 'M') {
  if (!coverId) return null;
  return `${COVER_BASE}/${coverId}-${size}.jpg`;
}

/**
 * Normalise a single Open Library search doc into our shape.
 * @param {Object} doc - Raw doc from Open Library /search.json results array
 * @returns {{ olid, title, authors, firstPublishedYear, coverId, isbn, subjects, pageCount, publisher }}
 */
export function mapBookResult(doc) {
  // key is like "/works/OL123W" — strip the prefix for a clean OLID
  const olid = doc.cover_edition_key ?? (doc.key ? doc.key.replace(/^\/works\//, '') : null);

  return {
    olid: olid ?? null,
    title: doc.title ?? null,
    authors: Array.isArray(doc.author_name) ? doc.author_name : [],
    firstPublishedYear: doc.first_publish_year ?? null,
    coverId: doc.cover_i ?? null,
    isbn: Array.isArray(doc.isbn) ? doc.isbn : [],
    subjects: Array.isArray(doc.subject) ? doc.subject : [],
    pageCount: doc.number_of_pages_median ?? null,
    publisher: Array.isArray(doc.publisher) ? doc.publisher : [],
  };
}
