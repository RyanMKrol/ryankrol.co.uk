import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm from '../../../../../components/v2/V2ArticleForm';
import V2Layout from '../../../../../components/v2/V2Layout';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];
const SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn', 'Day', 'Night'];
const PROJECTION_LABELS = { 1: 'Skin scent', 2: 'Moderate', 3: 'Strong', 4: 'Beast mode' };

export default function V2EditPerfumeReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    designer: '',
    type: PERFUME_TYPES[0],
    rating: 0,
    description: '',
    notes: '',
    considerTravelSize: false,
    considerFullBottle: false,
    longevity: 0,
    projection: 1,
    seasons: [],
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

    async function fetchPerfumeReview() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const perfumes = await response.json();
        const decodedId = decodeURIComponent(id);
        const perfume = perfumes.find((p) => p.id === decodedId);
        if (!perfume) throw new Error('Perfume not found');

        setOriginalData(perfume);
        setFormData({
          title: perfume.title,
          designer: perfume.designer,
          type: perfume.type || PERFUME_TYPES[0],
          rating: perfume.rating || 0,
          description: perfume.description || '',
          notes: perfume.notes || '',
          considerTravelSize: !!perfume.considerTravelSize,
          considerFullBottle: !!perfume.considerFullBottle,
          longevity: perfume.longevity ?? 0,
          projection: perfume.projection ?? 1,
          seasons: perfume.seasons || [],
          password: '',
        });
      } catch (err) {
        setMessage('Error loading perfume review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumeReview();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRatingChange = (e) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    setFormData({ ...formData, rating: Number.isNaN(value) ? 0 : value });
  };

  const handleLongevityChange = (e) => {
    setFormData({ ...formData, longevity: parseInt(e.target.value, 10) });
  };

  const handleProjectionChange = (e) => {
    setFormData({ ...formData, projection: parseInt(e.target.value, 10) });
  };

  const toggleSeason = (season) => {
    setFormData((prev) => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter((s) => s !== season)
        : [...prev.seasons, season],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/perfumes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalId: originalData.id,
          date: originalData.date,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review updated successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/perfumes/edit'), 2000);
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
      const response = await fetch('/api/reviews/perfumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: originalData.id, password: formData.password }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review deleted successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/perfumes/edit'), 2000);
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
        <p className="v2-status">Loading perfume review…</p>
      </V2Layout>
    );
  }

  return (
    <V2ArticleForm
      kicker="Edit perfume review"
      headline={originalData?.title || 'Edit perfume'}
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
        <label className="v2-field-label" htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          className="v2-input v2-headline-input"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="designer">Designer</label>
        <input
          id="designer"
          name="designer"
          type="text"
          className="v2-input"
          value={formData.designer}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="type">Type</label>
        <select
          id="type"
          name="type"
          className="v2-select"
          value={formData.type}
          onChange={handleInputChange}
          required
        >
          {PERFUME_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="v2-field-label" htmlFor="rating">Rating (0–10)</label>
        <input
          id="rating"
          name="rating"
          type="number"
          min="0"
          max="10"
          step="1"
          className="v2-input"
          value={formData.rating}
          onChange={handleRatingChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="v2-textarea"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          className="v2-textarea"
          value={formData.notes}
          onChange={handleInputChange}
        />
      </div>

      <div className="v2-checkbox-group">
        <label className="v2-checkbox-row">
          <input
            type="checkbox"
            name="considerTravelSize"
            checked={formData.considerTravelSize}
            onChange={handleInputChange}
          />
          Consider travel size
        </label>
        <label className="v2-checkbox-row">
          <input
            type="checkbox"
            name="considerFullBottle"
            checked={formData.considerFullBottle}
            onChange={handleInputChange}
          />
          Consider full bottle
        </label>
      </div>

      <div>
        <label className="v2-field-label" htmlFor="longevity">
          Longevity: {formData.longevity >= 8 ? '8+' : formData.longevity}
        </label>
        <input
          id="longevity"
          name="longevity"
          type="range"
          min="0"
          max="8"
          step="1"
          value={formData.longevity}
          onChange={handleLongevityChange}
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="projection">
          Projection: {PROJECTION_LABELS[formData.projection]}
        </label>
        <input
          id="projection"
          name="projection"
          type="range"
          min="1"
          max="4"
          step="1"
          value={formData.projection}
          onChange={handleProjectionChange}
        />
      </div>

      <div>
        <span className="v2-field-label">Seasons</span>
        <div className="v2-checkbox-group">
          {SEASONS.map((season) => (
            <label className="v2-checkbox-row" key={season}>
              <input
                type="checkbox"
                checked={formData.seasons.includes(season)}
                onChange={() => toggleSeason(season)}
              />
              {season}
            </label>
          ))}
        </div>
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
