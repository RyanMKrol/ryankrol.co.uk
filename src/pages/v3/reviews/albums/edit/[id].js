import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../../../components/v3/V3Layout';
import V3EditForm from '../../../../../components/v3/V3EditForm';
import StarRating from '../../../../../components/StarRating';

export default function V3EditAlbumReview() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({ title: '', artist: '', rating: 0, highlights: '', password: '' });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchAlbumReview() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const albums = await response.json();
        const decodedId = decodeURIComponent(id);
        const [title, artist] = decodedId.split('|');
        const album = albums.find((a) => a.title === title && a.artist === artist);
        if (!album) throw new Error('album not found');

        setOriginalData(album);
        setFormData({
          title: album.title,
          artist: album.artist,
          rating: album.rating || 0,
          highlights: album.highlights || '',
          password: '',
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAlbumReview();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/reviews/albums/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, originalTitle: originalData.title, originalArtist: originalData.artist }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error updating review');
  };

  const handleDelete = async () => {
    const response = await fetch('/api/reviews/albums/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: originalData.title, artist: originalData.artist, password: formData.password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error deleting review');
    router.push('/v3/reviews/albums/edit');
  };

  return (
    <V3Layout title="albums — edit">
      {loading && <p className="v3-status">loading…</p>}
      {loadError && <p className="v3-status v3-error">error: {loadError}</p>}

      {!loading && !loadError && (
        <V3EditForm
          type="albums"
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
            artist{' '}
            <input type="text" name="artist" value={formData.artist} onChange={handleChange} disabled required />
          </label>
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
