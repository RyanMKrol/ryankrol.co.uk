import { useState, useEffect } from 'react';
import BulkBackfillList from '../../../components/BulkBackfillList';
import { needsBookBackfill } from '../../../lib/backfillEligibility';

export default function BackfillBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/reviews/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();
        setBooks(data.filter(needsBookBackfill));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  const handleSearch = async (book) => {
    const params = new URLSearchParams({
      title: book.title.trim(),
      provider: 'googlebooks',
    });
    if (book.author && book.author.trim()) params.set('author', book.author.trim());
    const res = await fetch(`/api/books/search?${params}`);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Search failed');
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        err.retryAfterSeconds = Number.isFinite(retryAfter) ? retryAfter : 1;
      }
      throw err;
    }
    return data;
  };

  const handleConfirm = async (book, candidate) => {
    const response = await fetch('/api/reviews/books/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        rating: book.rating,
        overview: book.review_text,
        originalId: book.id,
        password,
        source: candidate.source,
        coverUrl: candidate.coverUrl,
        volumeId: candidate.volumeId,
        bookAuthors: candidate.authors,
        firstPublishedYear: candidate.firstPublishedYear,
        isbn: candidate.isbn,
        subjects: candidate.subjects,
        pageCount: candidate.pageCount,
        publisher: candidate.publisher,
        skipEditedDate: true,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Save failed');
    }
  };

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <h1 className="page-title">backfill book metadata</h1>

      <div className="collection-form-card">
        <div className="collection-form-group">
          <label className="collection-form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="collection-form-input"
            required
          />
        </div>
      </div>

      {books.length === 0 ? (
        <p>Nothing to backfill</p>
      ) : (
        <BulkBackfillList
          items={books}
          pageSize={15}
          onSearch={handleSearch}
          renderItemLabel={(book) => book.title}
          getCandidateKey={(candidate, i) => candidate.volumeId ?? i}
          renderCandidate={(result) => (
            <div className="mbm-card-row">
              {result.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.coverUrl}
                  alt={result.title}
                  className="mbm-thumb"
                  width={40}
                  height={60}
                />
              ) : (
                <div className="mbm-thumb mbm-thumb-placeholder" />
              )}
              <div className="mbm-card-info">
                <p className="mbm-card-title">
                  <strong>{result.title}</strong>
                  {result.firstPublishedYear && (
                    <span className="mbm-card-year"> ({result.firstPublishedYear})</span>
                  )}
                </p>
                {result.authors && result.authors.length > 0 && (
                  <p className="mbm-card-secondary">{result.authors.join(', ')}</p>
                )}
              </div>
            </div>
          )}
          onConfirm={handleConfirm}
        />
      )}

      <style jsx>{`
        .mbm-card-row {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .mbm-thumb {
          object-fit: cover;
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .mbm-thumb-placeholder {
          width: 40px;
          height: 60px;
          background: var(--color-hairline);
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .mbm-card-info {
          flex: 1;
          min-width: 0;
        }
        .mbm-card-title {
          font-size: 0.9rem;
          margin: 0 0 0.25rem;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .mbm-card-year {
          font-weight: 400;
          opacity: 0.7;
        }
        .mbm-card-secondary {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0;
          line-height: 1.4;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}
