import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import { LongevitySlider, ProjectionSlider, SeasonsCheckboxes } from '../../../../components/PerfumeCharacteristics';

const PERFUME_TYPES = ['EDP', 'EDT', 'Parfum'];

export default function EditPerfumeReview() {
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
        const perfume = perfumes.find(p => p.id === decodedId);

        if (!perfume) {
          throw new Error('Perfume not found');
        }

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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRatingChange = (e) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    setFormData({
      ...formData,
      rating: Number.isNaN(value) ? 0 : value,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/perfumes/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        setTimeout(() => {
          router.push('/reviews/perfumes/edit');
        }, 2000);
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

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: originalData.id,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Perfume review deleted successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/perfumes/edit');
        }, 2000);
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
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading perfume review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">🧴 Edit Perfume Review</h1>

      <div className="form-container">
        {message && (
          <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="designer">Designer</label>
            <input
              type="text"
              id="designer"
              name="designer"
              value={formData.designer}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              {PERFUME_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rating">Rating (0-10)</label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="0"
              max="10"
              step="1"
              value={formData.rating}
              onChange={handleRatingChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input form-textarea"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-input form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="considerTravelSize"
                checked={formData.considerTravelSize}
                onChange={handleInputChange}
              />
              {' '}Consider travel size
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
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

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="form-button"
              disabled={saving || deleting}
            >
              {saving ? 'Updating Review...' : 'Update Review'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting || !formData.password}
              className="btn-danger"
            >
              {deleting ? 'Deleting Review...' : 'Delete Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
