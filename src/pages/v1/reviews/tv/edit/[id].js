import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../../components/StarRating';
import V1FormShell, {
  V1FormRow,
  V1FormSubmit,
  V1FormActions,
  V1FormDanger,
} from '../../../../../components/v1/V1FormShell';

export default function V1EditTVReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({ title: '', rating: 0, gist: '', password: '' });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchTVReview() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch tv');
        const tv = await response.json();

        const decodedTitle = decodeURIComponent(id);
        const movie = tv.find((m) => m.title === decodedTitle);

        if (!movie) throw new Error('TV show not found');

        setOriginalData(movie);
        setFormData({
          title: movie.title,
          rating: movie.rating || 0,
          gist: movie.review_text || '',
          password: '',
        });
      } catch (err) {
        setMessage('Error loading TV show review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchTVReview();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/tv/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, originalTitle: originalData.title }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('TV show review updated.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/tv/edit'), 1500);
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
      const response = await fetch('/api/reviews/tv/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: originalData.title, password: formData.password }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('TV show review deleted.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/tv/edit'), 1500);
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
      <V1FormShell breadcrumb="~ / reviews / tv / edit" title="Loading…">
        <p>Loading TV show review…</p>
      </V1FormShell>
    );
  }

  return (
    <V1FormShell
      breadcrumb={`~ / reviews / tv / edit / ${formData.title}`}
      title="Edit TV show review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input type="text" id="title" name="title" value={formData.title} disabled />
      </V1FormRow>

      <V1FormRow label="Rating">
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </V1FormRow>

      <V1FormRow label="Review" htmlFor="gist">
        <textarea id="gist" name="gist" value={formData.gist} onChange={handleInputChange} required />
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
