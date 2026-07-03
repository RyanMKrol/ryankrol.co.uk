import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Head from 'next/head';
import LastfmAlbumSearch from '../../components/LastfmAlbumSearch';

export default function AddVinyl() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
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
      const response = await fetch('/api/vinyl/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vinyl record added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/vinyl');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding vinyl record');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding vinyl record');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Vinyl - ryankrol.co.uk</title>
      </Head>

      <div className="review-container">
        <Header />
        <h1 className="page-title">💿 Add Vinyl Record</h1>

        <div className="collection-form-card">
          {message && (
            <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="collection-form-input"
                placeholder="Album/Record title..."
                required
              />
            </div>

            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="artist">Artist *</label>
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
              <label className="collection-form-label">Last.fm Match *</label>
              <LastfmAlbumSearch
                titleQuery={formData.title}
                onSelect={handleLastfmSelect}
              />
              {!lastfmMatch && (
                <p className="vinyl-form-hint">
                  Search and select a Last.fm match before saving
                </p>
              )}
            </div>

            {lastfmMatch?.thumbnail && (
              <div className="collection-form-group vinyl-lastfm-cover-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lastfmMatch.thumbnail}
                  alt={formData.title}
                  className="vinyl-lastfm-preview-img"
                  width={80}
                  height={80}
                />
                <span className="vinyl-lastfm-preview-label">Cover from Last.fm</span>
              </div>
            )}

            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="password">Password *</label>
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
              disabled={saving || !lastfmMatch}
            >
              {saving ? 'Adding Record...' : 'Add Vinyl Record'}
            </button>
          </form>
        </div>
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
    </>
  );
}
