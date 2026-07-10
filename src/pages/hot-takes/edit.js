import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { sortByDateDesc } from '../../lib/hotTakes';
import { formatReviewDate } from '../../lib/dateFormat';

export default function EditHotTakes() {
  const [hotTakes, setHotTakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHotTakes() {
      try {
        const response = await fetch('/api/hot-takes');
        if (!response.ok) throw new Error('Failed to fetch hot takes');
        const data = await response.json();
        setHotTakes(sortByDateDesc(data || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHotTakes();
  }, []);

  return (
    <>
      <Head>
        <title>Edit Hot Takes - ryankrol.co.uk</title>
      </Head>

      <div className="review-container">
        <h1 className="page-title">edit hot takes</h1>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading hot takes...</p>
          </div>
        )}

        {error && <p className="error-text">Error: {error}</p>}

        {!loading && !error && (
          <ul className="hot-takes-edit-list">
            {hotTakes.map((take) => (
              <li key={take.id} className="review-edit-card hot-takes-edit-item">
                <div className="review-edit-header">
                  <Link
                    href={`/hot-takes/edit/${encodeURIComponent(take.id)}`}
                    className="review-edit-button"
                  >
                    Edit
                  </Link>
                </div>
                <span className="hot-takes-text">{take.text}</span>
                <span className="hot-takes-date">{formatReviewDate(take.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .hot-takes-edit-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .hot-takes-edit-item {
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .hot-takes-text {
          display: block;
          font-size: 1.05rem;
        }
        .hot-takes-date {
          display: block;
          font-size: 0.85rem;
          opacity: 0.6;
          margin-top: 0.25rem;
        }
      `}</style>
    </>
  );
}
