import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import StarRating from '../../../components/StarRating';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';

export default function AddAlbumReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    rating: 0,
    highlights: '',
    password: ''
  });
  const [lastfmMatch, setLastfmMatch] = useState(null);
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

  const handleLastfmSelect = (match) => {
    if (match) {
      setFormData(prev => ({
        ...prev,
        title: match.title || prev.title,
        artist: match.artist || prev.artist,
      }));
    }
    setLastfmMatch(match);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const body = {
      ...formData,
      ...(lastfmMatch && { lastfm: lastfmMatch.lastfm }),
    };

    try {
      const response = await fetch('/api/reviews/albums/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
            <label className="form-label">Last.fm Match (optional)</label>
            <LastfmAlbumSearch
              titleQuery={formData.title}
              onSelect={handleLastfmSelect}
            />
          </div>

          {lastfmMatch?.thumbnail && (
            <div className="form-group lastfm-cover-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lastfmMatch.thumbnail}
                alt={formData.title}
                className="lastfm-preview-img"
                width={80}
                height={80}
              />
              <span className="lastfm-preview-label">Cover from Last.fm</span>
            </div>
          )}

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

      <style jsx>{`
        .lastfm-cover-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .lastfm-preview-img {
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .lastfm-preview-label {
          font-size: 0.85rem;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
