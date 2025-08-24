import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';

export default function AddAlbumReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    rating: 0,
    highlights: '',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/albums/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Album review added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/albums');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🎵 Add Album Review</h1>
      
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
              placeholder="Album title..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="artist">Artist</label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Artist name..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="highlights">Highlights</label>
            <textarea
              id="highlights"
              name="highlights"
              value={formData.highlights}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Share your favorite tracks from this album..."
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
            disabled={saving || formData.rating === 0}
          >
            {saving ? 'Adding Review...' : 'Add Review'}
          </button>
        </form>
      </div>
    </div>
  );
}