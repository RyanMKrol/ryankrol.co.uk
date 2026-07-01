import { useState } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../components/StarRating';
import BookSearch from '../../../../components/BookSearch';
import V1FormShell, { V1FormRow, V1FormSubmit } from '../../../../components/v1/V1FormShell';

export default function V1AddBookReview() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    rating: 0,
    overview: '',
    password: '',
  });
  const [bookMatch, setBookMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const router = useRouter();

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
        setMessage('Book review added.');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v1/reviews/books');
        }, 1500);
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
    <V1FormShell
      breadcrumb="~ / reviews / books / add"
      title="Add book review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Author" htmlFor="author">
        <input
          type="text"
          id="author"
          name="author"
          value={formData.author}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Book match">
        <BookSearch title={formData.title} author={formData.author} onSelect={setBookMatch} />
      </V1FormRow>

      <V1FormRow label="Rating">
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </V1FormRow>

      <V1FormRow label="Review" htmlFor="overview">
        <textarea
          id="overview"
          name="overview"
          value={formData.overview}
          onChange={handleInputChange}
          placeholder="Share your thoughts about this book..."
          required
        />
      </V1FormRow>

      <V1FormRow label="Password" htmlFor="password">
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormSubmit disabled={loading || formData.rating === 0}>
        {loading ? 'Adding…' : 'Add review'}
      </V1FormSubmit>
    </V1FormShell>
  );
}
