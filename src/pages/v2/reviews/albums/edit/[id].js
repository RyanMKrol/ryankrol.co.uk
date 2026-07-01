import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../../components/v2/V2ArticleForm';
import V2Layout from '../../../../../components/v2/V2Layout';

export default function V2EditAlbumReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '', artist: '', rating: 0, highlights: '', password: '',
  });
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
        const decodedId = decodeURIComponent(id);
        const [title, artist] = decodedId.split('|');
        const album = albums.find((a) => a.title === title && a.artist === artist);
        if (!album) throw new Error('Album not found');

        setOriginalData(album);
        setFormData({
          title: album.title,
          artist: album.artist,
          rating: album.rating || 0,
          highlights: album.highlights || '',
          password: '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalTitle: originalData.title,
          originalArtist: originalData.artist,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Album review updated successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/albums/edit'), 2000);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalData.title,
          artist: originalData.artist,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Album review deleted successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/albums/edit'), 2000);
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
      <V2Layout>
        <p className="v2-status">Loading album review…</p>
      </V2Layout>
    );
  }

  return (
    <V2ArticleForm
      kicker="Edit album review"
      headline={originalData?.title || 'Edit album'}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      loading={saving}
      message={message}
      messageType={messageType}
      secondaryAction={{
        label: 'Delete review',
        onClick: handleDelete,
        disabled: saving || deleting || !formData.password,
        pending: deleting,
        pendingLabel: 'Deleting…',
      }}
    >
      <div>
        <label className="v2-field-label" htmlFor="artist">Artist</label>
        <input
          id="artist"
          name="artist"
          type="text"
          className="v2-input"
          value={formData.artist}
          disabled
          required
        />
      </div>

      <div>
        <label className="v2-field-label">Rating</label>
        <V2StarPicker rating={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="highlights">Highlights</label>
        <textarea
          id="highlights"
          name="highlights"
          className="v2-textarea"
          value={formData.highlights}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="v2-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>
    </V2ArticleForm>
  );
}
