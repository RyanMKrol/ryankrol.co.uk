import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  LongevitySlider,
  ProjectionSlider,
  SeasonsCheckboxes,
} from '../../../../../components/PerfumeCharacteristics';
import V1FormShell, {
  V1FormRow,
  V1FormSubmit,
  V1FormActions,
  V1FormDanger,
} from '../../../../../components/v1/V1FormShell';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function V1EditPerfumeReview() {
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

  const handleSeasonsChange = (seasons) => {
    setFormData({ ...formData, seasons });
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
        setMessage('Perfume review updated.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/perfumes/edit'), 1500);
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
      const response = await fetch('/api/reviews/perfumes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: originalData.id, password: formData.password }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review deleted.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/perfumes/edit'), 1500);
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
      <V1FormShell breadcrumb="~ / reviews / perfumes / edit" title="Loading…">
        <p>Loading perfume review…</p>
      </V1FormShell>
    );
  }

  return (
    <V1FormShell
      breadcrumb={`~ / reviews / perfumes / edit / ${formData.title}`}
      title="Edit perfume review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Designer" htmlFor="designer">
        <input
          type="text"
          id="designer"
          name="designer"
          value={formData.designer}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Type" htmlFor="type">
        <select id="type" name="type" value={formData.type} onChange={handleInputChange} required>
          {PERFUME_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </V1FormRow>

      <V1FormRow label="Rating (0-10)" htmlFor="rating">
        <input
          type="number"
          id="rating"
          name="rating"
          min="0"
          max="10"
          step="1"
          value={formData.rating}
          onChange={handleRatingChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} />
      </V1FormRow>

      <V1FormRow label="Travel size">
        <label>
          <input
            type="checkbox"
            name="considerTravelSize"
            checked={formData.considerTravelSize}
            onChange={handleInputChange}
          />{' '}
          Consider travel size
        </label>
      </V1FormRow>

      <V1FormRow label="Full bottle">
        <label>
          <input
            type="checkbox"
            name="considerFullBottle"
            checked={formData.considerFullBottle}
            onChange={handleInputChange}
          />{' '}
          Consider full bottle
        </label>
      </V1FormRow>

      <LongevitySlider value={formData.longevity} onChange={handleLongevityChange} />
      <ProjectionSlider value={formData.projection} onChange={handleProjectionChange} />
      <SeasonsCheckboxes value={formData.seasons} onChange={handleSeasonsChange} />

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
        <V1FormSubmit disabled={saving || deleting}>{saving ? 'Saving…' : 'Save'}</V1FormSubmit>
        <V1FormDanger disabled={saving || deleting || !formData.password} onClick={handleDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </V1FormDanger>
      </V1FormActions>
    </V1FormShell>
  );
}
