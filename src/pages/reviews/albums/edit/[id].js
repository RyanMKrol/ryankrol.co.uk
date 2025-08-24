import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import StarRating from '../../../../components/StarRating';

export default function EditAlbumReview() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    rating: 0,
    highlights: '',
    password: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchAlbumReview() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const albums = await response.json();
        
        // Decode the ID to get title and artist
        const decodedId = decodeURIComponent(id);
        const [title, artist] = decodedId.split('|');
        
        // Find the album by title and artist
        const album = albums.find(a => a.title === title && a.artist === artist);
        
        if (!album) {
          throw new Error('Album not found');
        }
        
        setOriginalData(album);
        setFormData({
          title: album.title,
          artist: album.artist,
          rating: album.rating || 0,
          highlights: album.highlights || '',
          password: ''
        });
      } catch (err) {
        setMessage('Error loading album review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchAlbumReview();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/albums/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalTitle: originalData.title,
          originalArtist: originalData.artist
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Album review updated successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/albums/edit');
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

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading album review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🎵 Edit Album Review</h1>
      
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
            <label className="form-label" htmlFor="artist">Artist</label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="form-input"
              disabled
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
            {saving ? 'Updating Review...' : 'Update Review'}
          </button>
        </form>
      </div>
    </div>
  );
}