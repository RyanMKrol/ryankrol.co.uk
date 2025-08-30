import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Head from 'next/head';

export default function AddVinyl() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/vinyl/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vinyl record added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/vinyl');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding vinyl record');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding vinyl record');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Vinyl - ryankrol.co.uk</title>
      </Head>
      
      <div className="review-container">
        <Header />
        <h1 className="page-title">💿 Add Vinyl Record</h1>
        
        <div className="form-container">
          {message && (
            <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Album/Record title..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="artist">Artist *</label>
              <input
                type="text"
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Artist name..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="form-button"
              disabled={saving}
            >
              {saving ? 'Adding Record...' : 'Add Vinyl Record'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}