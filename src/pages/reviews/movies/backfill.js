import { useState, useEffect } from 'react';
import BulkBackfillList from '../../../components/BulkBackfillList';
import { needsMovieBackfill } from '../../../lib/backfillEligibility';
import { tmdbPosterUrl } from '../../../lib/tmdb';

export default function BackfillMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const data = await response.json();
        setMovies(data.filter(needsMovieBackfill));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  const handleSearch = async (movie) => {
    const params = new URLSearchParams({
      query: movie.title.trim(),
      type: 'movie',
    });
    const res = await fetch(`/api/tmdb/search?${params}`);
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

  const handleConfirm = async (movie, candidate) => {
    const response = await fetch('/api/reviews/movies/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: movie.title,
        rating: movie.rating,
        gist: movie.review_text,
        originalId: movie.id,
        password,
        tmdbId: candidate.tmdbId,
        mediaType: candidate.mediaType,
        posterPath: candidate.posterPath,
        tmdbOverview: candidate.overview,
        tmdbDate: candidate.date,
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
          <p>Loading movies...</p>
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
      <h1 className="page-title">backfill movie metadata</h1>

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

      {movies.length === 0 ? (
        <p>Nothing to backfill</p>
      ) : (
        <BulkBackfillList
          items={movies}
          pageSize={15}
          onSearch={handleSearch}
          renderItemLabel={(movie) => movie.title}
          getCandidateKey={(candidate, i) => candidate.tmdbId ?? i}
          renderCandidate={(result) => (
            <div className="mbm-card-row">
              {tmdbPosterUrl(result.posterPath) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tmdbPosterUrl(result.posterPath)}
                  alt={result.title}
                  className="mbm-thumb"
                  width={60}
                  height={90}
                />
              ) : (
                <div className="mbm-thumb mbm-thumb-placeholder" />
              )}
              <div className="mbm-card-info">
                <p className="mbm-card-title">
                  <strong>{result.title}</strong>
                  {result.date && <span className="mbm-card-year"> ({result.date.slice(0, 4)})</span>}
                </p>
                {result.overview && (
                  <p className="mbm-card-secondary">
                    {result.overview.slice(0, 160)}{result.overview.length > 160 ? '…' : ''}
                  </p>
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
          width: 60px;
          height: 90px;
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
