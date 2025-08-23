import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

export default function EditBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <h1 className="page-title">📚 Edit Book Reviews</h1>
      
      <div className="edit-list">
        {books.map((book, index) => (
          <div key={`${book.title}-${book.author}-${index}`} className="edit-item">
            <div className="edit-item-content">
              <h3 className="edit-item-title">{book.title}</h3>
              <p className="edit-item-author">by {book.author}</p>
              <p className="edit-item-rating">Rating: {book.rating}/5</p>
              <p className="edit-item-date">{book.date}</p>
            </div>
            <Link 
              href={`/reviews/books/edit/${encodeURIComponent(book.title + '|' + book.author)}`}
              className="edit-button"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}