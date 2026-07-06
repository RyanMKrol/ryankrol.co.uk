import { useState } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../components/StarRating';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';
import MarkdownEditor from '../../../components/MarkdownEditor';

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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
    setHasAttemptedSubmit(true);

    if (!lastfmMatch) {
      setMessage('Search and select a Last.fm match before saving');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    const body = {
      ...formData,
      lastfm: lastfmMatch.lastfm,
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
      <h1 className="page-title">add album review</h1>

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
              placeholder="Album title..."
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="artist">Artist</label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="collection-form-input"
              placeholder="Artist name..."
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Last.fm Match</label>
            <LastfmAlbumSearch
              titleQuery={formData.title}
              onSelect={handleLastfmSelect}
            />
            {hasAttemptedSubmit && !lastfmMatch && (
              <p className="collection-form-message collection-form-message-error">
                Search and select a Last.fm match before saving
              </p>
            )}
          </div>

          {lastfmMatch?.thumbnail && (
            <div className="collection-form-group lastfm-cover-preview">
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

          <div className="collection-form-group">
            <label className="collection-form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="highlights">Highlights</label>
            <MarkdownEditor
              id="highlights"
              name="highlights"
              value={formData.highlights}
              onChange={handleInputChange}
              className="collection-form-textarea"
              placeholder="Share your favorite tracks from this album..."
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
            disabled={saving || formData.rating === 0 || !lastfmMatch}
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
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .lastfm-preview-label {
          font-size: 0.85rem;
          opacity: 0.7;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}
