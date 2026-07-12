import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';

export default function EditVinylRecord() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    password: ''
  });
  const [lastfmMatch, setLastfmMatch] = useState(null);
  const [previewThumbnail, setPreviewThumbnail] = useState('');
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchVinylRecord() {
      try {
        const response = await fetch('/api/vinyl');
        if (!response.ok) throw new Error('Failed to fetch vinyl collection');
        const vinyl = await response.json();

        const decodedId = decodeURIComponent(id);
        const record = vinyl.find(v => v.id === decodedId);

        if (!record) {
          throw new Error('Vinyl record not found');
        }

        setOriginalData(record);
        setFormData({
          title: record.title || '',
          artist: record.artist || '',
          password: ''
        });
        setPreviewThumbnail(record.thumbnail || '');
      } catch (err) {
        setMessage('Error loading vinyl record');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchVinylRecord();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLastfmSelect = (match) => {
    if (match) {
      setFormData(prev => ({
        ...prev,
        title: match.title || prev.title,
        artist: match.artist || prev.artist,
      }));
      setPreviewThumbnail(match.thumbnail || '');
    }
    setLastfmMatch(match);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/vinyl/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalId: originalData.id,
          lastfm: lastfmMatch?.lastfm
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vinyl record updated successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/vinyl/edit');
        }, 2000);
      } else {
        setMessage(result.message || 'Error updating vinyl record');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error updating vinyl record');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading vinyl record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <h1 className="page-title">edit vinyl record</h1>

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
            <label className="collection-form-label" htmlFor="artist">Artist</label>
            <input
              type="text"
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="collection-form-input"
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Re-search Last.fm</label>
            <LastfmAlbumSearch
              titleQuery={formData.title}
              onSelect={handleLastfmSelect}
            />
            <p className="vinyl-form-hint">
              Search and select a match to update the cover, or leave this record unchanged if no
              good match is found.
            </p>
          </div>

          {previewThumbnail && (
            <div className="collection-form-group vinyl-lastfm-cover-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewThumbnail}
                alt={formData.title}
                className="vinyl-lastfm-preview-img"
                width={80}
                height={80}
              />
              <span className="vinyl-lastfm-preview-label">
                {lastfmMatch ? 'New cover from Last.fm' : 'Current cover'}
              </span>
            </div>
          )}

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
              disabled={saving}
            >
              {saving ? 'Updating Record...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .vinyl-form-hint {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          font-family: var(--font-body);
          color: var(--color-ink);
          opacity: 0.7;
        }
        .vinyl-lastfm-cover-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .vinyl-lastfm-preview-img {
          object-fit: cover;
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .vinyl-lastfm-preview-label {
          font-size: 0.85rem;
          font-family: var(--font-body);
          color: var(--color-ink);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
