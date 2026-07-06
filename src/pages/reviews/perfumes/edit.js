import { useState, useEffect } from 'react';
import Link from 'next/link';
import Variant6Hybrid from '../../../components/perfumeVariants/Variant6Hybrid';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';

export default function EditPerfumes() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columnCount = useResponsiveColumnCount(2, 700);

  useEffect(() => {
    async function fetchPerfumes() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const data = await response.json();

        const sortedPerfumes = data.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB - dateA;
        });
        setPerfumes(sortedPerfumes);
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
          <p>Loading perfumes...</p>
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
      <h1 className="page-title">edit perfume reviews</h1>

      <MasonryColumns
        items={perfumes}
        columnCount={columnCount}
        className="perfume-card-grid"
        columnClassName="perfume-card-grid-col"
        renderItem={(perfume, index) => (
          <div key={`${perfume.id}-${index}`} className="review-edit-card">
            <div className="review-edit-header">
              <Link
                href={`/reviews/perfumes/edit/${encodeURIComponent(perfume.id)}`}
                className="review-edit-button"
              >
                Edit
              </Link>
            </div>
            <Variant6Hybrid item={perfume} />
          </div>
        )}
      />
    </div>
  );
}
