import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import StarRating from '../../../../components/StarRating';
import MetadataBackfillModal from '../../../../components/MetadataBackfillModal';

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
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchBookReview() {
      try {
        const response = await fetch('/api/reviews/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const books = await response.json();
        
        const decodedId = decodeURIComponent(id);

        // Find the book by id
        const book = books.find(b => b.id === decodedId);
        
        if (!book) {
          throw new Error('Book not found');
        }
        
        setOriginalData(book);
        setFormData({
          title: book.title,
          author: book.author,
          rating: book.rating || 0,
          overview: book.review_text || '',
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

  const handleBackfillSearch = async () => {
    const params = new URLSearchParams({
      title: formData.title.trim(),
      provider: 'googlebooks',
    });
    if (formData.author.trim()) params.set('author', formData.author.trim());
    const res = await fetch(`/api/books/search?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search failed');
    return data;
  };

  const handleBackfillConfirm = (result) => {
    setFormData({
      ...formData,
      source: result.source,
      coverUrl: result.coverUrl,
      volumeId: result.volumeId,
      bookAuthors: result.authors,
      firstPublishedYear: result.firstPublishedYear,
      isbn: result.isbn,
      subjects: result.subjects,
      pageCount: result.pageCount,
      publisher: result.publisher,
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
          originalId: originalData.id
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
      const response = await fetch('/api/reviews/books/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: originalData.id,
          password: formData.password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Book review deleted successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/books/edit');
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
            <MetadataBackfillModal
              buttonLabel="Backfill from Google Books"
              onSearch={handleBackfillSearch}
              onConfirm={handleBackfillConfirm}
              getResultKey={(result, i) => result.volumeId ?? i}
              renderResult={(result) => (
                <>
                  <strong>{result.title}</strong>
                  {result.firstPublishedYear && ` (${result.firstPublishedYear})`}
                  {result.authors && result.authors.length > 0 && (
                    <p>{result.authors.join(', ')}</p>
                  )}
                </>
              )}
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

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="form-button"
              disabled={saving || deleting || formData.rating === 0}
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