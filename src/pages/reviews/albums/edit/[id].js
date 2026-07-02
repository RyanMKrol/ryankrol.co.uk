import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import StarRating from '../../../../components/StarRating';
import MetadataBackfillModal from '../../../../components/MetadataBackfillModal';

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
  const [backfillThumbnail, setBackfillThumbnail] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchAlbumReview() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const albums = await response.json();
        
        // Decode the ID
        const decodedId = decodeURIComponent(id);

        // Find the album by id
        const album = albums.find(a => a.id === decodedId);
        
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
        setBackfillThumbnail(album.thumbnail || '');
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

  const handleBackfillSearch = async () => {
    const query = formData.title.trim() || formData.artist.trim();
    const res = await fetch(`/api/lastfm/album-search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');
    return data.results;
  };

  const handleBackfillConfirm = async (result) => {
    try {
      const url = result.mbid
        ? `/api/lastfm/album-info?mbid=${encodeURIComponent(result.mbid)}`
        : `/api/lastfm/album-info?artist=${encodeURIComponent(result.artist)}&album=${encodeURIComponent(result.title)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch album info');

      const info = data.info;
      setFormData(prev => ({
        ...prev,
        lastfm: {
          mbid: info.mbid || '',
          url: info.url || '',
          listeners: info.listeners || 0,
          playcount: info.playcount || 0,
          tags: info.tags || [],
          trackCount: info.trackCount || 0,
          summary: info.summary || '',
          releaseDate: info.releaseDate || '',
          images: info.images || {},
        },
      }));
      setBackfillThumbnail(info.image || '');
    } catch (err) {
      setMessage(err.message || 'Failed to fetch album info');
      setMessageType('error');
    }
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
          originalId: originalData.id
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
      const response = await fetch('/api/reviews/albums/delete', {
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
        setMessage('Album review deleted successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/albums/edit');
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
            <MetadataBackfillModal
              buttonLabel="Backfill from Last.fm"
              onSearch={handleBackfillSearch}
              onConfirm={handleBackfillConfirm}
              getResultKey={(result, i) => result.mbid ?? i}
              renderResult={(result) => (
                <>
                  <strong>{result.title}</strong>
                  {result.artist && <p>{result.artist}</p>}
                </>
              )}
            />
          </div>

          {backfillThumbnail && (
            <div className="form-group lastfm-cover-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backfillThumbnail}
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