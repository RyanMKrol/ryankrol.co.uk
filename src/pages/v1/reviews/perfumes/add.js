import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  LongevitySlider,
  ProjectionSlider,
  SeasonsCheckboxes,
} from '../../../../components/PerfumeCharacteristics';
import V1FormShell, { V1FormRow, V1FormSubmit } from '../../../../components/v1/V1FormShell';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function V1AddPerfumeReview() {
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/perfumes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review added.');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v1/reviews/perfumes');
        }, 1500);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <V1FormShell
      breadcrumb="~ / reviews / perfumes / add"
      title="Add perfume review"
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
          placeholder="Share your thoughts about this perfume..."
          required
        />
      </V1FormRow>

      <V1FormRow label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Top/heart/base notes..."
        />
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

      <V1FormSubmit disabled={loading}>{loading ? 'Adding…' : 'Add review'}</V1FormSubmit>
    </V1FormShell>
  );
}
