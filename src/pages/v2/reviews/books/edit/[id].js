import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../../components/v2/V2ArticleForm';
import V2Layout from '../../../../../components/v2/V2Layout';

export default function V2EditBookReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '', author: '', rating: 0, overview: '', password: '',
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
        setMessage('Book review updated successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/books/edit'), 2000);
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
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: originalData.title,
          author: originalData.author,
          password: formData.password,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Book review deleted successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/books/edit'), 2000);
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
      <V2Layout>
        <p className="v2-status">Loading book review…</p>
      </V2Layout>
    );
  }

  return (
    <V2ArticleForm
      kicker="Edit book review"
      headline={originalData?.title || 'Edit book'}
      onSubmit={handleSubmit}
      submitLabel="Save changes"
      loading={saving}
      message={message}
      messageType={messageType}
      secondaryAction={{
        label: 'Delete review',
        onClick: handleDelete,
        disabled: saving || deleting || !formData.password,
        pending: deleting,
        pendingLabel: 'Deleting…',
      }}
    >
      <div>
        <label className="v2-field-label" htmlFor="author">Author</label>
        <input
          id="author"
          name="author"
          type="text"
          className="v2-input"
          value={formData.author}
          disabled
          required
        />
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
