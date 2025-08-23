import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';

export default function AddMovieReview() {
  const [formData, setFormData] = useState({
    title: '',
    rating: 0,
    gist: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
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
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/movies/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
              required
            />
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

          <button
            type="submit"
            className="form-button"
            disabled={loading || formData.rating === 0}
          >
            {loading ? 'Adding Review...' : 'Add Review'}
          </button>
        </form>
      </div>
    </div>
  );
}