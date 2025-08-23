import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import StarRating from '../../../../components/StarRating';

export default function EditBookReview() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    rating: 0,
    overview: '',
    password: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchBookReview() {
      try {
        const response = await fetch('/api/reviews/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const books = await response.json();
        
        // Decode the ID to get title and author
        const decodedId = decodeURIComponent(id);
        const [title, author] = decodedId.split('|');
        
        // Find the book by title and author
        const book = books.find(b => b.title === title && b.author === author);
        
        if (!book) {
          throw new Error('Book not found');
        }
        
        setOriginalData(book);
        setFormData({
          title: book.title,
          author: book.author,
          rating: book.rating,
          overview: book.overview,
          password: ''
        });
      } catch (err) {
        setMessage('Error loading book review');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchBookReview();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/books/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalTitle: originalData.title,
          originalAuthor: originalData.author
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Book review updated successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/books/edit');
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

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading book review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">📚 Edit Book Review</h1>
      
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
              disabled
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="form-input"
              disabled
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="overview">Review</label>
            <textarea
              id="overview"
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Share your thoughts about this book..."
              required
            />
          </div>

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

          <button
            type="submit"
            className="form-button"
            disabled={saving || formData.rating === 0}
          >
            {saving ? 'Updating Review...' : 'Update Review'}
          </button>
        </form>
      </div>
    </div>
  );
}