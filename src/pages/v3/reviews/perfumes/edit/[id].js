import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../../components/v3/V3Layout';
import V3EditForm from '../../../../../components/v3/V3EditForm';
import { LongevitySlider, ProjectionSlider, SeasonsCheckboxes } from '../../../../../components/PerfumeCharacteristics';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function V3EditPerfumeReview() {
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
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchPerfumeReview() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const perfumes = await response.json();
        const decodedId = decodeURIComponent(id);
        const perfume = perfumes.find((p) => p.id === decodedId);
        if (!perfume) throw new Error('perfume not found');

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
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumeReview();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRatingChange = (e) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    setFormData({ ...formData, rating: Number.isNaN(value) ? 0 : value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/reviews/perfumes/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, originalId: originalData.id, date: originalData.date }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error updating review');
  };

  const handleDelete = async () => {
    const response = await fetch('/api/reviews/perfumes/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: originalData.id, password: formData.password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error deleting review');
    router.push('/v3/reviews/perfumes/edit');
  };

  return (
    <V3Layout title="perfumes — edit">
      {loading && <p className="v3-status">loading…</p>}
      {loadError && <p className="v3-status v3-error">error: {loadError}</p>}

      {!loading && !loadError && (
        <V3EditForm type="perfumes" onSubmit={handleSubmit} onDelete={handleDelete} deleteDisabled={!formData.password}>
          <label>
            title{' '}
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </label>
          <label>
            designer{' '}
            <input type="text" name="designer" value={formData.designer} onChange={handleChange} required />
          </label>
          <label>
            type{' '}
            <select name="type" value={formData.type} onChange={handleChange} required>
              {PERFUME_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            rating (0-10){' '}
            <input
              type="number"
              name="rating"
              min="0"
              max="10"
              step="1"
              value={formData.rating}
              onChange={handleRatingChange}
              required
            />
          </label>
          <label>
            description
            <textarea name="description" value={formData.description} onChange={handleChange} required />
          </label>
          <label>
            notes
            <textarea name="notes" value={formData.notes} onChange={handleChange} />
          </label>
          <label>
            <input
              type="checkbox"
              name="considerTravelSize"
              checked={formData.considerTravelSize}
              onChange={handleChange}
            />{' '}
            consider travel size
          </label>
          <label>
            <input
              type="checkbox"
              name="considerFullBottle"
              checked={formData.considerFullBottle}
              onChange={handleChange}
            />{' '}
            consider full bottle
          </label>
          <LongevitySlider
            value={formData.longevity}
            onChange={(e) => setFormData({ ...formData, longevity: parseInt(e.target.value, 10) })}
          />
          <ProjectionSlider
            value={formData.projection}
            onChange={(e) => setFormData({ ...formData, projection: parseInt(e.target.value, 10) })}
          />
          <SeasonsCheckboxes value={formData.seasons} onChange={(seasons) => setFormData({ ...formData, seasons })} />
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
