import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import TmdbSearch from '../../../components/TmdbSearch';

export default function AddMovieReview() {
  const [formData, setFormData] = useState({
    title: '',
    rating: 0,
    gist: '',
    password: ''
  });
  const [tmdbMatch, setTmdbMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!tmdbMatch) {
      setMessage('Search and select a TMDB match before saving');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const body = {
      ...formData,
      tmdbId: tmdbMatch.tmdbId,
      mediaType: tmdbMatch.mediaType,
      posterPath: tmdbMatch.posterPath,
      tmdbOverview: tmdbMatch.overview,
      tmdbDate: tmdbMatch.date,
    };

    try {
      const response = await fetch('/api/reviews/movies/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/movies');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🎬 Add Movie Review</h1>

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
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">TMDB Match</label>
            <TmdbSearch
              mediaType="movie"
              query={formData.title}
              onSelect={setTmdbMatch}
            />
            {hasAttemptedSubmit && !tmdbMatch && (
              <p className="collection-form-message collection-form-message-error">
                Search and select a TMDB match before saving
              </p>
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

          <button
            type="submit"
            className="collection-form-button"
            disabled={loading || formData.rating === 0 || !tmdbMatch}
          >
            {loading ? 'Adding Review...' : 'Add Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
