import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';

export default function AddHotTake() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    text: '',
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

    if (!formData.text.trim()) {
      setMessage('A non-empty take is required');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/hot-takes/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Hot take added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/hot-takes');
        }, 2000);
      } else {
        setMessage(result.message || 'Error adding hot take');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding hot take');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Hot Take - ryankrol.co.uk</title>
      </Head>

      <div className="review-container">
        <Header />
        <h1 className="page-title">add hot take</h1>

        <div className="collection-form-card">
          {message && (
            <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="text">Take *</label>
              <textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                className="collection-form-input"
                placeholder="What's your hot take..."
                rows={4}
                required
              />
            </div>

            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="collection-form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="collection-form-button"
              disabled={saving}
            >
              {saving ? 'Adding Take...' : 'Add Hot Take'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
