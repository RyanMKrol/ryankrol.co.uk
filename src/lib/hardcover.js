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
