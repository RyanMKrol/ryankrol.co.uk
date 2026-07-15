import { useState } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../components/StarRating';
import BookSearch from '../../../components/BookSearch';
import MarkdownEditor from '../../../components/MarkdownEditor';
import Markdown from '../../../components/Markdown';

export default function AddBookReview() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    rating: 0,
    overview: '',
    password: ''
  });
  const [bookMatch, setBookMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const router = useRouter();

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
    setHasAttemptedSubmit(true);

    if (!bookMatch) {
      setMessage('Search and select a Google Books match before saving');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const body = {
      ...formData,
      source: bookMatch.source,
      olid: bookMatch.olid,
      coverId: bookMatch.coverId,
      coverUrl: bookMatch.coverUrl,
      volumeId: bookMatch.volumeId,
      bookAuthors: bookMatch.bookAuthors,
      firstPublishedYear: bookMatch.firstPublishedYear,
      isbn: bookMatch.isbn,
      subjects: bookMatch.subjects,
      pageCount: bookMatch.pageCount,
      publisher: bookMatch.publisher,
    };

    try {
      const response = await fetch('/api/reviews/books/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Book review added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/reviews/books');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-container">
      <h1 className="page-title">add book review</h1>

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
            <label className="collection-form-label" htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              className="collection-form-input"
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Book Match</label>
            <BookSearch
              title={formData.title}
              author={formData.author}
              onSelect={setBookMatch}
            />
            {hasAttemptedSubmit && !bookMatch && (
              <p className="collection-form-message collection-form-message-error">
                Search and select a Google Books match before saving
              </p>
            )}
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Rating</label>
            <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label" htmlFor="overview">Review</label>
            <MarkdownEditor
              id="overview"
              name="overview"
              value={formData.overview}
              onChange={handleInputChange}
              className="collection-form-textarea"
              placeholder="Share your thoughts about this book..."
              required
            />
          </div>

          <div className="collection-form-group">
            <label className="collection-form-label">Preview</label>
            <Markdown>{formData.overview}</Markdown>
          </div>

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

          <button
            type="submit"
            className="collection-form-button"
            disabled={loading || formData.rating === 0 || !bookMatch}
          >
            {loading ? 'Adding Review...' : 'Add Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
