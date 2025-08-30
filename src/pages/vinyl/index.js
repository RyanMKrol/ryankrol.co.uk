import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';

export default function VinylPage() {
  const [vinyl, setVinyl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVinyl() {
      try {
        const response = await fetch('/api/vinyl');
        if (response.ok) {
          const data = await response.json();
          setVinyl(data || []);
        } else {
          setError('Failed to fetch vinyl collection');
        }
      } catch (err) {
        setError('Error fetching vinyl collection');
      } finally {
        setLoading(false);
      }
    }

    fetchVinyl();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const groupByLetter = (items) => {
    const grouped = {};
    items.forEach(item => {
      const getArtistForSorting = (artist) => {
        if (!artist) return '';
        return artist.replace(/^The\s+/i, '').trim();
      };
      
      const sortingArtist = getArtistForSorting(item.artist);
      const firstLetter = sortingArtist.charAt(0).toUpperCase() || '#';
      
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(item);
    });
    return grouped;
  };

  const groupedVinyl = groupByLetter(vinyl);
  const sortedLetters = Object.keys(groupedVinyl).sort();

  return (
    <>
      <Head>
        <title>My Vinyl - ryankrol.co.uk</title>
      </Head>
      
      <div className="container">
        <Header />
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          💿 My Vinyl
        </h1>
        
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
          {vinyl.length > 0 ? `${vinyl.length} records in my collection` : 'Loading collection...'}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading vinyl collection...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && vinyl.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No vinyl records found.
          </div>
        )}

        {!loading && !error && vinyl.length > 0 && (
          <div>
            {sortedLetters.map((letter, letterIndex) => (
              <div key={letter} style={{ marginBottom: letterIndex === sortedLetters.length - 1 ? '0' : '2rem' }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  color: '#374151'
                }}>
                  {letter}
                </h2>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {groupedVinyl[letter].map((record, index) => (
                    <div 
                      key={`${record.artist}-${record.title}-${index}`}
                      style={{
                        padding: '1rem',
                        borderBottom: index === groupedVinyl[letter].length - 1 ? 'none' : '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '1.1rem', 
                          fontWeight: 'bold', 
                          marginBottom: '0.25rem',
                          color: '#111827'
                        }}>
                          {record.title || 'Unknown Title'}
                        </h3>
                        
                        <p style={{ 
                          color: '#666', 
                          fontSize: '0.95rem',
                          marginBottom: '0.5rem'
                        }}>
                          by {record.artist || 'Unknown Artist'}
                        </p>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap',
                          gap: '1rem',
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          {record.year && (
                            <span>Year: {record.year}</span>
                          )}
                          {record.format && (
                            <span>Format: {record.format}</span>
                          )}
                          {record.label && (
                            <span>Label: {record.label}</span>
                          )}
                          {record.date_added && (
                            <span>Added: {formatDate(record.date_added)}</span>
                          )}
                          {record.condition && (
                            <span>Condition: {record.condition}</span>
                          )}
                        </div>
                        
                        {record.notes && (
                          <p style={{ 
                            marginTop: '0.5rem',
                            fontSize: '0.9rem',
                            color: '#555',
                            fontStyle: 'italic'
                          }}>
                            "{record.notes}"
                          </p>
                        )}
                      </div>
                      
                      {record.price && (
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#059669',
                          textAlign: 'right'
                        }}>
                          ${record.price}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}