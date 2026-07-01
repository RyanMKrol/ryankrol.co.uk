import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../../components/v2/V2ArticleForm';
import V2Layout from '../../../../../components/v2/V2Layout';

export default function V2EditMovieReview() {
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

    async function fetchMovieReview() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const movies = await response.json();
        const decodedTitle = decodeURIComponent(id);
        const movie = movies.find((m) => m.title === decodedTitle);
        if (!movie) throw new Error('Movie not found');

        setOriginalData(movie);
        setFormData({ title: movie.title, rating: movie.rating || 0, gist: movie.review_text || '', password: '' });
      } catch (err) {
        setMessage('Error loading movie review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchMovieReview();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/movies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, originalTitle: originalData.title }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review updated successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/movies/edit'), 2000);
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
      const response = await fetch('/api/reviews/movies/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: originalData.title, password: formData.password }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review deleted successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/movies/edit'), 2000);
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
        <p className="v2-status">Loading movie review…</p>
      </V2Layout>
    );
  }

  return (
    <V2ArticleForm
      kicker="Edit movie review"
      headline={originalData?.title || 'Edit movie'}
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
        <label className="v2-field-label">Rating</label>
        <V2StarPicker rating={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="gist">Review</label>
        <textarea
          id="gist"
          name="gist"
          className="v2-textarea"
          value={formData.gist}
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
