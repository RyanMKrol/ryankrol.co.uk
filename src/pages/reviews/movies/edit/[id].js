import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import StarRating from '../../../../components/StarRating';
import MetadataBackfillModal from '../../../../components/MetadataBackfillModal';
import { tmdbPosterUrl } from '../../../../lib/tmdb';

export default function EditMovieReview() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    title: '',
    rating: 0,
    gist: '',
    password: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchMovieReview() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const movies = await response.json();
        
        // Decode the ID
        const decodedId = decodeURIComponent(id);

        // Find the movie by id
        const movie = movies.find(m => m.id === decodedId);
        
        if (!movie) {
          throw new Error('Movie not found');
        }
        
        setOriginalData(movie);
        setFormData({
          title: movie.title,
          rating: movie.rating || 0,
          gist: movie.review_text || '',
          password: '',
          tmdbId: movie.tmdbId,
          mediaType: movie.mediaType,
          posterPath: movie.posterPath,
          tmdbOverview: movie.tmdbOverview,
          tmdbDate: movie.tmdbDate
        });
      } catch (err) {
        setMessage('Error loading movie review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchMovieReview();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleBackfillSearch = async () => {
    const params = new URLSearchParams({
      query: formData.title.trim(),
      type: 'movie',
    });
    const res = await fetch(`/api/tmdb/search?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');
    return data;
  };

  const handleBackfillConfirm = (result) => {
    setFormData({
      ...formData,
      tmdbId: result.tmdbId,
      mediaType: result.mediaType,
      posterPath: result.posterPath,
      tmdbOverview: result.overview,
      tmdbDate: result.date,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/movies/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalId: originalData.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review updated successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/movies/edit');
        }, 2000);
      } else {
        setMessage(result.message || 'Error updating review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error updating review');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    if (!formData.password) {
      setMessage('Password is required to delete reviews');
      setMessageType('error');
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/movies/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: originalData.id,
          password: formData.password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review deleted successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/movies/edit');
        }, 2000);
      } else {
        setMessage(result.message || 'Error deleting review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error deleting review');
      setMessageType('error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movie review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🎬 Edit Movie Review</h1>

      <div className="collection-form-card">
        {message && (
          <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="collection-form-input"
              disabled
              required
            />
          </div>

          <div className="collection-form-group">
            <MetadataBackfillModal
              buttonLabel="Backfill from TMDB"
              onSearch={handleBackfillSearch}
              onConfirm={handleBackfillConfirm}
              getResultKey={(result, i) => result.tmdbId ?? i}
              renderResult={(result) => (
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
            />
            {formData.posterPath && (
              <img
                src={tmdbPosterUrl(formData.posterPath)}
                alt={`${formData.title} poster`}
                style={{ maxWidth: '150px', marginTop: '0.75rem', borderRadius: 'var(--radius-cover)' }}
              />
            )}
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="gist">Review</label>
            <textarea
              id="gist"
              name="gist"
              value={formData.gist}
              onChange={handleInputChange}
              className="collection-form-textarea"
              placeholder="Share your thoughts about this movie..."
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="collection-form-input"
              required
            />
          </div>

          <div className="collection-form-actions">
            <button
              type="submit"
              className="collection-form-button"
              disabled={saving || deleting || formData.rating === 0}
            >
              {saving ? 'Updating Review...' : 'Update Review'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting || !formData.password}
              className="collection-form-button collection-form-button-danger"
            >
              {deleting ? 'Deleting Review...' : 'Delete Review'}
            </button>
          </div>
        </form>
      </div>

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