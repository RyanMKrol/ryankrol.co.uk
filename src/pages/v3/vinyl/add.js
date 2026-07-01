import { useState } from 'react';
import { useRouter } from 'next/router';
import V3Layout from '../../../components/v3/V3Layout';
import V3AddEntry from '../../../components/v3/V3AddEntry';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';

export default function V3AddVinyl() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', artist: '', password: '' });
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

    const response = await fetch('/api/vinyl/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'error adding record');
    router.push('/v3/vinyl');
  };

  return (
    <V3Layout title="vinyl — add">
      <V3AddEntry type="vinyl" onSubmit={handleSubmit}>
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
        <label>
          password{' '}
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>
      </V3AddEntry>
    </V3Layout>
  );
}
