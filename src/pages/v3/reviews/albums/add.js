import { useState } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../components/v3/V3Layout';
import V3AddEntry from '../../../../components/v3/V3AddEntry';
import StarRating from '../../../../components/StarRating';
import LastfmAlbumSearch from '../../../../components/LastfmAlbumSearch';

export default function V3AddAlbumReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', artist: '', rating: 0, highlights: '', password: '' });
  const [lastfmMatch, setLastfmMatch] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLastfmSelect = (match) => {
    if (match) {
      setFormData((prev) => ({
        ...prev,
        title: match.title || prev.title,
        artist: match.artist || prev.artist,
      }));
    }
    setLastfmMatch(match);
  };

  const handleSubmit = async () => {
    const body = {
      ...formData,
      ...(lastfmMatch && { lastfm: lastfmMatch.lastfm }),
    };

    const response = await fetch('/api/reviews/albums/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error adding review');
    router.push('/v3/reviews/albums');
  };

  return (
    <V3Layout title="albums — add">
      <V3AddEntry type="albums" onSubmit={handleSubmit} disabled={formData.rating === 0}>
        <label>
          title{' '}
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        <label>
          artist{' '}
          <input type="text" name="artist" value={formData.artist} onChange={handleChange} required />
        </label>
        <div>
          <span>last.fm match (optional)</span>
          <LastfmAlbumSearch titleQuery={formData.title} onSelect={handleLastfmSelect} />
        </div>
        <div>
          <span>rating </span>
          <StarRating rating={formData.rating} onRatingChange={(rating) => setFormData({ ...formData, rating })} />
        </div>
        <label>
          highlights
          <textarea name="highlights" value={formData.highlights} onChange={handleChange} required />
        </label>
        <label>
          password{' '}
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>
      </V3AddEntry>
    </V3Layout>
  );
}
