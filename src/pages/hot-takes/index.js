import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import { formatReviewDate } from '../../lib/dateFormat';

export default function HotTakesPage() {
  const [hotTakes, setHotTakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHotTakes() {
      try {
        const response = await fetch('/api/hot-takes');
        if (response.ok) {
          const data = await response.json();
          setHotTakes(data || []);
        } else {
          setError('Failed to fetch hot takes');
        }
      } catch (err) {
        setError('Error fetching hot takes');
      } finally {
        setLoading(false);
      }
    }

    fetchHotTakes();
  }, []);

  return (
    <>
      <Head>
        <title>Hot Takes - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <h1 className="page-title">hot takes</h1>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading hot takes...
          </div>
        )}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {!loading && !error && hotTakes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No hot takes yet.
          </div>
        )}

        {!loading && !error && hotTakes.length > 0 && (
          <ul className="hot-takes-list">
            {hotTakes.map((take) => (
              <li key={take.id} className="hot-takes-item">
                <span className="hot-takes-text">{take.text}</span>
                <span className="hot-takes-date">{formatReviewDate(take.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .hot-takes-list {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0;
        }
        .hot-takes-item {
          margin-bottom: 1.25rem;
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
