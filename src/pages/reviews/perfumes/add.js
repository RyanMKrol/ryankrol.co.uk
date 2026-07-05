import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import PipMeter from '../../../components/PipMeter';
import { LongevitySlider, ProjectionSlider, SeasonsCheckboxes, ApplicationSpotsSprayer } from '../../../components/PerfumeCharacteristics';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function AddPerfumeReview() {
  const [formData, setFormData] = useState({
    title: '',
    designer: '',
    type: PERFUME_TYPES[0],
    rating: 0,
    description: '',
    considerTravelSize: false,
    considerFullBottle: false,
    longevity: 0,
    projection: 1,
    seasons: [],
    applicationSpots: [],
    fragranticaUrl: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [designerSuggestions, setDesignerSuggestions] = useState([]);
  const [hoveredRating, setHoveredRating] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await fetch('/api/reviews/perfumes');
        const result = await response.json();
        const reviews = Array.isArray(result) ? result : result.reviews || [];
        const designers = [...new Set(reviews.map((review) => review.designer).filter(Boolean))];
        setDesignerSuggestions(designers);
      } catch (error) {
        setDesignerSuggestions([]);
      }
    };

    fetchDesigners();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating,
    });
  };

  const handleLongevityChange = (e) => {
    setFormData({
      ...formData,
      longevity: parseInt(e.target.value, 10),
    });
  };

  const handleProjectionChange = (e) => {
    setFormData({
      ...formData,
      projection: parseInt(e.target.value, 10),
    });
  };

  const handleSeasonsChange = (seasons) => {
    setFormData({
      ...formData,
      seasons,
    });
  };

  const handleApplicationSpotsChange = (applicationSpots) => {
    setFormData({
      ...formData,
      applicationSpots,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/perfumes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/perfumes');
        }, 2000);
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
    <div className="review-container">
      <Header />
      <h1 className="page-title">add perfume review</h1>

      <div className="collection-form-card">
        {message && (
          <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="collection-form-input"
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="designer">Designer</label>
            <input
              type="text"
              id="designer"
              name="designer"
              value={formData.designer}
              onChange={handleInputChange}
              className="collection-form-input"
              list="designer-suggestions"
              autoComplete="off"
              required
            />
            <datalist id="designer-suggestions">
              {designerSuggestions.map((designer) => (
                <option key={designer} value={designer} />
              ))}
            </datalist>
          </div>

          <div className="collection-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="collection-form-label" htmlFor="type" style={{ display: 'inline', flexShrink: 0 }}>Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="collection-form-input"
              style={{ width: 'auto' }}
              required
            >
              {PERFUME_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="rating">
              Rating (0-10): {hoveredRating || formData.rating}
            </label>
            <PipMeter
              value={formData.rating}
              onChange={handleRatingChange}
              onHoverChange={setHoveredRating}
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="collection-form-textarea"
              placeholder="Share your thoughts about this perfume..."
              required
            />
          </div>

          <ApplicationSpotsSprayer value={formData.applicationSpots} onChange={handleApplicationSpotsChange} />

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="fragranticaUrl">Fragrantica URL</label>
            <input
              type="url"
              id="fragranticaUrl"
              name="fragranticaUrl"
              value={formData.fragranticaUrl}
              onChange={handleInputChange}
              className="collection-form-input"
              placeholder="https://www.fragrantica.com/perfume/..."
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">
              <input
                type="checkbox"
                name="considerTravelSize"
                checked={formData.considerTravelSize}
                onChange={handleInputChange}
              />
              {' '}Consider travel size
            </label>
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">
              <input
                type="checkbox"
                name="considerFullBottle"
                checked={formData.considerFullBottle}
                onChange={handleInputChange}
              />
              {' '}Consider full bottle
            </label>
          </div>

          <LongevitySlider value={formData.longevity} onChange={handleLongevityChange} />

          <ProjectionSlider value={formData.projection} onChange={handleProjectionChange} />

          <SeasonsCheckboxes value={formData.seasons} onChange={handleSeasonsChange} />

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="collection-form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="collection-form-button"
            disabled={loading}
          >
            {loading ? 'Adding Review...' : 'Add Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
