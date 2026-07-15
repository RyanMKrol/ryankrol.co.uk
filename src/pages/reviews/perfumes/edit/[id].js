import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PipMeter from '../../../../components/PipMeter';
import { LongevitySlider, ProjectionSlider, SeasonsCheckboxes, ApplicationSpotsSprayer, OwnershipPicker } from '../../../../components/PerfumeCharacteristics';
import MarkdownEditor from '../../../../components/MarkdownEditor';
import Markdown from '../../../../components/Markdown';

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
    ownership: 'Sample',
    longevity: 0,
    projection: 1,
    seasons: [],
    applicationSpots: [],
    fragranticaUrl: '',
    password: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

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
          ownership: perfume.ownership || 'Sample',
          longevity: perfume.longevity ?? 0,
          projection: perfume.projection ?? 1,
          seasons: perfume.seasons || [],
          applicationSpots: perfume.applicationSpots || [],
          fragranticaUrl: perfume.fragranticaUrl || '',
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
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading perfume review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <h1 className="page-title">edit perfume review</h1>

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
              required
            />
          </div>

          <div className="collection-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="collection-form-label" htmlFor="type" style={{ display: 'inline', flexShrink: 0 }}>Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="collection-form-input collection-form-select"
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
            <MarkdownEditor
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="collection-form-textarea"
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Preview</label>
            <Markdown>{formData.description}</Markdown>
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

          <OwnershipPicker value={formData.ownership} onChange={(ownership) => setFormData({ ...formData, ownership })} />

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

          <div className="collection-form-actions">
            <button
              type="submit"
              className="collection-form-button"
              disabled={saving || deleting}
            >
              {saving ? 'Updating Review...' : 'Update Review'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting || !formData.password}
              className="collection-form-button collection-form-button-danger"
            >
              {deleting ? 'Deleting Review...' : 'Delete Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
