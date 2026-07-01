import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../../components/v3/V3Layout';
import V3EditForm from '../../../../../components/v3/V3EditForm';
import StarRating from '../../../../../components/StarRating';

export default function V3EditBookReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({ title: '', author: '', rating: 0, overview: '', password: '' });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
        if (!book) throw new Error('book not found');

        setOriginalData(book);
        setFormData({
          title: book.title,
          author: book.author,
          rating: book.rating || 0,
          overview: book.review_text || '',
          password: '',
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookReview();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/reviews/books/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, originalTitle: originalData.title, originalAuthor: originalData.author }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error updating review');
  };

  const handleDelete = async () => {
    const response = await fetch('/api/reviews/books/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: originalData.title, author: originalData.author, password: formData.password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error deleting review');
    router.push('/v3/reviews/books/edit');
  };

  return (
    <V3Layout title="books — edit">
      {loading && <p className="v3-status">loading…</p>}
      {loadError && <p className="v3-status v3-error">error: {loadError}</p>}

      {!loading && !loadError && (
        <V3EditForm
          type="books"
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          submitDisabled={formData.rating === 0}
          deleteDisabled={!formData.password}
        >
          <label>
            title{' '}
            <input type="text" name="title" value={formData.title} onChange={handleChange} disabled required />
          </label>
          <label>
            author{' '}
            <input type="text" name="author" value={formData.author} onChange={handleChange} disabled required />
          </label>
          <div>
            <span>rating </span>
            <StarRating rating={formData.rating} onRatingChange={(rating) => setFormData({ ...formData, rating })} />
          </div>
          <label>
            review
            <textarea name="overview" value={formData.overview} onChange={handleChange} required />
          </label>
          <label>
            password{' '}
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </label>
        </V3EditForm>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }
      `}</style>
    </V3Layout>
  );
}
