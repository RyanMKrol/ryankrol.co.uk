import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../../components/StarRating';
import V1FormShell, {
  V1FormRow,
  V1FormSubmit,
  V1FormActions,
  V1FormDanger,
} from '../../../../../components/v1/V1FormShell';

export default function V1EditAlbumReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    rating: 0,
    highlights: '',
    password: '',
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
        setMessage('Album review updated.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/albums/edit'), 1500);
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
    if (!confirm('Delete this review? This cannot be undone.')) return;

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
        setMessage('Album review deleted.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/albums/edit'), 1500);
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
      <V1FormShell breadcrumb="~ / reviews / albums / edit" title="Loading…">
        <p>Loading album review…</p>
      </V1FormShell>
    );
  }

  return (
    <V1FormShell
      breadcrumb={`~ / reviews / albums / edit / ${formData.title}`}
      title="Edit album review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input type="text" id="title" name="title" value={formData.title} disabled />
      </V1FormRow>

      <V1FormRow label="Artist" htmlFor="artist">
        <input type="text" id="artist" name="artist" value={formData.artist} disabled />
      </V1FormRow>

      <V1FormRow label="Rating">
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </V1FormRow>

      <V1FormRow label="Highlights" htmlFor="highlights">
        <textarea
          id="highlights"
          name="highlights"
          value={formData.highlights}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Password" htmlFor="password">
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormActions>
        <V1FormSubmit disabled={saving || deleting || formData.rating === 0}>
          {saving ? 'Saving…' : 'Save'}
        </V1FormSubmit>
        <V1FormDanger disabled={saving || deleting || !formData.password} onClick={handleDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </V1FormDanger>
      </V1FormActions>
    </V1FormShell>
  );
}
