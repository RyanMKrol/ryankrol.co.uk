import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import MasonryColumns from '../../../components/MasonryColumns';
import useResponsiveColumnCount from '../../../hooks/useResponsiveColumnCount';

export default function EditBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const columnCount = useResponsiveColumnCount(2, 700);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/reviews/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();
        
        // Sort by date (most recent first)
        const sortedBooks = data.sort((a, b) => {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB - dateA;
        });
        setBooks(sortedBooks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">edit book reviews</h1>
      <Link href="/reviews/books/backfill" className="backfill-link">
        Backfill metadata
      </Link>

      <MasonryColumns
        items={books}
        columnCount={columnCount}
        className="spine-cover-list"
        columnClassName="spine-cover-list-col"
        renderItem={(book) => (
          <div key={book.id} className="review-card-with-edit">
            <ReviewCard
              item={book}
              type="book"
              isLast={false}
              styleVariant="spine-cover"
            />
            <Link
              href={`/reviews/books/edit/${encodeURIComponent(book.id)}`}
              className="edit-button-overlay"
            >
              Edit
            </Link>
          </div>
        )}
      />

      <style jsx>{`
        .backfill-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: var(--color-accent-secondary);
        }
      `}</style>
    </div>
  );
}