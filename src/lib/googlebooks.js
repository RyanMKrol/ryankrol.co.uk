/**
 * Normalise a single Google Books volumes item into the common book-result shape.
 * @param {Object} volume - Raw item from Google Books /volumes response
 * @returns {{ source, volumeId, title, authors, firstPublishedYear, coverUrl, isbn, subjects, pageCount, publisher }}
 */
export function mapGoogleBooksResult(volume) {
  const info = (volume && volume.volumeInfo) ? volume.volumeInfo : {};

  const coverRaw =
    (info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) || null;
  const coverUrl = coverRaw ? coverRaw.replace(/^http:\/\//, 'https://') : null;

  const publishedDate = info.publishedDate ?? null;
  const yearMatch = publishedDate ? String(publishedDate).match(/^(\d{4})/) : null;
  const firstPublishedYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

  const identifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn = identifiers
    .filter((id) => id && id.identifier)
    .map((id) => id.identifier);

  return {
    source: 'googlebooks',
    volumeId: (volume && volume.id) ? volume.id : null,
    title: info.title ?? null,
    authors: Array.isArray(info.authors) ? info.authors : [],
    firstPublishedYear,
    coverUrl,
    isbn,
    subjects: Array.isArray(info.categories) ? info.categories : [],
    pageCount: (typeof info.pageCount === 'number') ? info.pageCount : null,
    publisher: info.publisher ? [info.publisher] : [],
  };
}
