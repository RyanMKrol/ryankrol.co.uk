import { useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../components/v2/V2ArticleForm';
import BookSearch from '../../../../components/BookSearch';

export default function V2AddBookReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '', author: '', rating: 0, overview: '', password: '',
  });
  const [bookMatch, setBookMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const body = {
      ...formData,
      ...(bookMatch && {
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
      }),
    };

    try {
      const response = await fetch('/api/reviews/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Book review added successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/books'), 2000);
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
    <V2ArticleForm
      kicker="New book review"
      headline="Add a book"
      onSubmit={handleSubmit}
      submitLabel="Publish review"
      loading={loading}
      message={message}
      messageType={messageType}
    >
      <div>
        <label className="v2-field-label" htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          className="v2-input v2-headline-input"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="author">Author</label>
        <input
          id="author"
          name="author"
          type="text"
          className="v2-input"
          value={formData.author}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label">Book match (optional)</label>
        <BookSearch title={formData.title} author={formData.author} onSelect={setBookMatch} />
      </div>

      <div>
        <label className="v2-field-label">Rating</label>
        <V2StarPicker rating={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="overview">Review</label>
        <textarea
          id="overview"
          name="overview"
          className="v2-textarea"
          placeholder="Share your thoughts about this book…"
          value={formData.overview}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="v2-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>
    </V2ArticleForm>
  );
}
