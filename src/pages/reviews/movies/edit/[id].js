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
        
        // Decode the ID to get title
        const decodedTitle = decodeURIComponent(id);
        
        // Find the movie by title
        const movie = movies.find(m => m.title === decodedTitle);
        
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
          originalTitle: originalData.title
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
          title: originalData.title,
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
      
      <div className="form-container">
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              disabled
              required
            />
          </div>

          <div className="form-group">
            <MetadataBackfillModal
              buttonLabel="Backfill from TMDB"
              onSearch={handleBackfillSearch}
              onConfirm={handleBackfillConfirm}
              getResultKey={(result, i) => result.tmdbId ?? i}
              renderResult={(result) => (
                <>
                  <strong>{result.title}</strong>
                  {result.date && ` (${result.date})`}
                </>
              )}
            />
            {formData.posterPath && (
              <img
                src={tmdbPosterUrl(formData.posterPath)}
                alt={`${formData.title} poster`}
                style={{ maxWidth: '150px', marginTop: '0.75rem', borderRadius: '4px' }}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gist">Review</label>
            <textarea
              id="gist"
              name="gist"
              value={formData.gist}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Share your thoughts about this movie..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="form-button"
              disabled={saving || deleting || formData.rating === 0}
            >
              {saving ? 'Updating Review...' : 'Update Review'}
            </button>
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting || !formData.password}
              className="btn-danger"
            >
              {deleting ? 'Deleting Review...' : 'Delete Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}