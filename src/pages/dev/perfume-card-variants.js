import { useState, useEffect } from 'react';
import Variant6Hybrid from '../../components/perfumeVariants/Variant6Hybrid';

const VARIANTS = [
  { key: 'baseline', label: 'Baseline (today\'s exact layout)' },
  { key: 'big-rating', label: 'Big rating (enlarged, same position)' },
  { key: 'header-rating', label: 'Header rating (moved up next to title)' },
  { key: 'best-for-bottom', label: 'Best-for moved to bottom' },
];

const SAMPLE_COUNT = 3;

export default function PerfumeCardVariantsDevPage() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPerfumes() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const data = await response.json();
        setPerfumes(data.slice(0, SAMPLE_COUNT));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumes();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading perfume reviews...</p>
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

  return (
    <div className="review-container">
      <h1 className="page-title">perfume card variants (dev)</h1>
      <p className="collection-review-meta">
        T343 — comparing rating size/position + &quot;Best for&quot; position, using real data. Delete this
        page once a winner is picked.
      </p>

      {VARIANTS.map(({ key, label }) => (
        <section key={key} style={{ marginTop: '2rem' }}>
          <h2 className="page-title" style={{ fontSize: '1.1rem' }}>{label}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {perfumes.map((perfume, index) => (
              <Variant6Hybrid key={`${key}-${perfume.id}-${index}`} item={perfume} variant={key} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
