import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../../components/v3/V3Layout';
import V3EditForm from '../../../../../components/v3/V3EditForm';
import StarRating from '../../../../../components/StarRating';

export default function V3EditTVReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({ title: '', rating: 0, gist: '', password: '' });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchTVReview() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch tv shows');
        const shows = await response.json();
        const decodedTitle = decodeURIComponent(id);
        const show = shows.find((s) => s.title === decodedTitle);
        if (!show) throw new Error('show not found');

        setOriginalData(show);
        setFormData({ title: show.title, rating: show.rating || 0, gist: show.review_text || '', password: '' });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTVReview();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/reviews/tv/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, originalTitle: originalData.title }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error updating review');
  };

  const handleDelete = async () => {
    const response = await fetch('/api/reviews/tv/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: originalData.title, password: formData.password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error deleting review');
    router.push('/v3/reviews/tv/edit');
  };

  return (
    <V3Layout title="tv — edit">
      {loading && <p className="v3-status">loading…</p>}
      {loadError && <p className="v3-status v3-error">error: {loadError}</p>}

      {!loading && !loadError && (
        <V3EditForm
          type="tv"
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          submitDisabled={formData.rating === 0}
          deleteDisabled={!formData.password}
        >
          <label>
            title{' '}
            <input type="text" name="title" value={formData.title} onChange={handleChange} disabled required />
          </label>
          <div>
            <span>rating </span>
            <StarRating rating={formData.rating} onRatingChange={(rating) => setFormData({ ...formData, rating })} />
          </div>
          <label>
            review
            <textarea name="gist" value={formData.gist} onChange={handleChange} required />
          </label>
          <label>
            password{' '}
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </label>
        </V3EditForm>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }
      `}</style>
    </V3Layout>
  );
}
