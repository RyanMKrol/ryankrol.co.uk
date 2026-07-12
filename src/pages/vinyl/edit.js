import { useState, useEffect } from 'react';
import Link from 'next/link';
import CoverTile, { assignGradients } from '../../components/CoverTile';

export default function EditVinyl() {
  const [vinyl, setVinyl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVinyl() {
      try {
        const response = await fetch('/api/vinyl');
        if (!response.ok) throw new Error('Failed to fetch vinyl collection');
        const data = await response.json();
        setVinyl(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVinyl();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading vinyl collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  const gradientKeys = vinyl
    .filter((record) => !record.thumbnail)
    .map((record) => record.id);
  const gradients = assignGradients(gradientKeys);
  const gradientById = new Map();
  let gradientIndex = 0;
  vinyl.forEach((record) => {
    if (!record.thumbnail) {
      gradientById.set(record.id, gradients[gradientIndex++]);
    }
  });

  return (
    <div className="review-container">
      <h1 className="page-title">edit vinyl</h1>

      <div className="vinyl-cover-grid">
        {vinyl.map((record) => (
          <div key={record.id} className="review-edit-card">
            <div className="review-edit-header">
              <Link
                href={`/vinyl/edit/${encodeURIComponent(record.id)}`}
                className="review-edit-button"
              >
                Edit
              </Link>
            </div>
            <CoverTile
              id={record.id}
              title={record.title || 'Unknown Title'}
              subtitle={record.artist || 'Unknown Artist'}
              imageUrl={record.thumbnail || undefined}
              gradient={gradientById.get(record.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
