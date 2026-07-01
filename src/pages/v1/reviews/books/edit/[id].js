import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../../components/StarRating';
import V1FormShell, {
  V1FormRow,
  V1FormSubmit,
  V1FormActions,
  V1FormDanger,
} from '../../../../../components/v1/V1FormShell';

export default function V1EditBookReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    rating: 0,
    overview: '',
    password: '',
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
        const [title, author] = decodedId.split('|');
        const book = books.find((b) => b.title === title && b.author === author);

        if (!book) throw new Error('Book not found');

        setOriginalData(book);
        setFormData({
          title: book.title,
          author: book.author,
          rating: book.rating || 0,
          overview: book.review_text || '',
          password: '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/books/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalTitle: originalData.title,
          originalAuthor: originalData.author,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Book review updated.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/books/edit'), 1500);
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

  const handleDelete = async () => {
    if (!confirm('Delete this review? This cannot be undone.')) return;

    setDeleting(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews/books/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalData.title,
          author: originalData.author,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Book review deleted.');
        setMessageType('success');
        setTimeout(() => router.push('/v1/reviews/books/edit'), 1500);
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
      <V1FormShell breadcrumb="~ / reviews / books / edit" title="Loading…">
        <p>Loading book review…</p>
      </V1FormShell>
    );
  }

  return (
    <V1FormShell
      breadcrumb={`~ / reviews / books / edit / ${formData.title}`}
      title="Edit book review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input type="text" id="title" name="title" value={formData.title} disabled />
      </V1FormRow>

      <V1FormRow label="Author" htmlFor="author">
        <input type="text" id="author" name="author" value={formData.author} disabled />
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

      <V1FormActions>
        <V1FormSubmit disabled={saving || deleting || formData.rating === 0}>
          {saving ? 'Saving…' : 'Save'}
        </V1FormSubmit>
        <V1FormDanger disabled={saving || deleting || !formData.password} onClick={handleDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </V1FormDanger>
      </V1FormActions>
    </V1FormShell>
  );
}
