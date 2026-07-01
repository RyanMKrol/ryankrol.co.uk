import { useState } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../components/v3/V3Layout';
import V3AddEntry from '../../../../components/v3/V3AddEntry';
import StarRating from '../../../../components/StarRating';
import BookSearch from '../../../../components/BookSearch';

export default function V3AddBookReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', author: '', rating: 0, overview: '', password: '' });
  const [bookMatch, setBookMatch] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
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

    const response = await fetch('/api/reviews/books/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error adding review');
    router.push('/v3/reviews/books');
  };

  return (
    <V3Layout title="books — add">
      <V3AddEntry type="books" onSubmit={handleSubmit} disabled={formData.rating === 0}>
        <label>
          title{' '}
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        <label>
          author{' '}
          <input type="text" name="author" value={formData.author} onChange={handleChange} required />
        </label>
        <div>
          <span>book match (optional)</span>
          <BookSearch title={formData.title} author={formData.author} onSelect={setBookMatch} />
        </div>
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
      </V3AddEntry>
    </V3Layout>
  );
}
