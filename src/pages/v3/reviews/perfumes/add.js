import { useState } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../components/v3/V3Layout';
import V3AddEntry from '../../../../components/v3/V3AddEntry';
import { LongevitySlider, ProjectionSlider, SeasonsCheckboxes } from '../../../../components/PerfumeCharacteristics';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function V3AddPerfumeReview() {
  const router = useRouter();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRatingChange = (e) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    setFormData({ ...formData, rating: Number.isNaN(value) ? 0 : value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/reviews/perfumes/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error adding review');
    router.push('/v3/reviews/perfumes');
  };

  return (
    <V3Layout title="perfumes — add">
      <V3AddEntry type="perfumes" onSubmit={handleSubmit}>
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
              <option key={type} value={type}>{type}</option>
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
      </V3AddEntry>
    </V3Layout>
  );
}
