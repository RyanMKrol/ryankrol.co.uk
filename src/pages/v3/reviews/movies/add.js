import { useState } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../components/v3/V3Layout';
import V3AddEntry from '../../../../components/v3/V3AddEntry';
import StarRating from '../../../../components/StarRating';
import TmdbSearch from '../../../../components/TmdbSearch';

export default function V3AddMovieReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', rating: 0, gist: '', password: '' });
  const [tmdbMatch, setTmdbMatch] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const body = {
      ...formData,
      ...(tmdbMatch && {
        tmdbId: tmdbMatch.tmdbId,
        mediaType: tmdbMatch.mediaType,
        posterPath: tmdbMatch.posterPath,
        tmdbOverview: tmdbMatch.overview,
        tmdbDate: tmdbMatch.date,
      }),
    };

    const response = await fetch('/api/reviews/movies/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error adding review');
    router.push('/v3/reviews/movies');
  };

  return (
    <V3Layout title="movies — add">
      <V3AddEntry type="movies" onSubmit={handleSubmit} disabled={formData.rating === 0}>
        <label>
          title{' '}
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        <div>
          <span>tmdb match (optional)</span>
          <TmdbSearch mediaType="movie" query={formData.title} onSelect={setTmdbMatch} />
        </div>
        <div>
          <span>rating </span>
          <StarRating rating={formData.rating} onRatingChange={(rating) => setFormData({ ...formData, rating })} />
        </div>
        <label>
          review
          <textarea name="gist" value={formData.gist} onChange={handleChange} required />
        </label>
        <label>
          password{' '}
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>
      </V3AddEntry>
    </V3Layout>
  );
}
