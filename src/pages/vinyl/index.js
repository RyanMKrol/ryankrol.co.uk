import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SearchInput from '../../components/SearchInput';
import PillGroup from '../../components/PillGroup';
import CoverTile, { assignGradients } from '../../components/CoverTile';

const VIEW_OPTIONS = [
  { value: 'covers', label: 'covers' },
  { value: 'list', label: 'list' },
];

function getArtistForSorting(artist) {
  if (!artist) return '';
  return artist.replace(/^The\s+/i, '').trim();
}

function groupByLetter(items) {
  const grouped = {};
  items.forEach(item => {
    const sortingArtist = getArtistForSorting(item.artist);
    const firstLetter = sortingArtist.charAt(0).toUpperCase() || '#';

    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(item);
  });
  return grouped;
}

export default function VinylPage() {
  const router = useRouter();
  const [vinyl, setVinyl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('covers');

  useEffect(() => {
    if (router.isReady && typeof router.query.q === 'string') {
      setSearchTerm(router.query.q);
    }
  }, [router.isReady, router.query.q]);

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

  const filteredVinyl = vinyl.filter(item =>
    (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedVinyl = groupByLetter(filteredVinyl);
  const sortedLetters = Object.keys(groupedVinyl).sort();

  const orderedVinyl = sortedLetters.flatMap((letter) => groupedVinyl[letter]);
  const gradientKeys = orderedVinyl
    .filter((record) => !record.thumbnail)
    .map((record) => record.id || `${record.artist}-${record.title}`);
  const gradients = assignGradients(gradientKeys);
  const gradientByRecord = new Map();
  let gradientIndex = 0;
  orderedVinyl.forEach((record) => {
    if (!record.thumbnail) {
      gradientByRecord.set(record, gradients[gradientIndex++]);
    }
  });

  return (
    <>
      <Head>
        <title>My Vinyl - ryankrol.co.uk</title>
      </Head>

      <div className="container">

        <div className="collection-review-header">
          <div className="collection-review-title-group">
            <h1 className="page-title">vinyl</h1>
            <p className="collection-review-meta">
              {vinyl.length} records on the shelf · sorted by artist
            </p>
          </div>

          <Link href="/vinyl/edit" className="vinyl-edit-link">
            Edit records
          </Link>

          <div className="collection-review-controls">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="search collection..."
            />
            <PillGroup
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
              accentColor="var(--accent-vinyl)"
            />
          </div>
        </div>

        {searchTerm && (
          <div className="search-results-count">
            Found {filteredVinyl.length} record{filteredVinyl.length !== 1 ? 's' : ''}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading vinyl collection...
          </div>
        )}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {!loading && !error && filteredVinyl.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No vinyl records found.
          </div>
        )}

        {!loading && !error && filteredVinyl.length > 0 && (
          <div>
            {sortedLetters.map((letter, letterIndex) => (
              <div key={letter} style={{ marginBottom: letterIndex === sortedLetters.length - 1 ? '0' : '2rem' }}>
                <div className="vinyl-letter-header">
                  <span className="vinyl-letter-header-letter">{letter}</span>
                  <span className="vinyl-letter-header-rule" />
                  <span className="vinyl-letter-header-count">
                    {groupedVinyl[letter].length} record{groupedVinyl[letter].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {view === 'covers' ? (
                  <div className="vinyl-cover-grid">
                    {groupedVinyl[letter].map((record, index) => (
                      <CoverTile
                        key={`${record.id || record.artist}-${record.title}-${index}`}
                        id={record.id || `${record.artist}-${record.title}`}
                        title={record.title || 'Unknown Title'}
                        subtitle={record.artist || 'Unknown Artist'}
                        imageUrl={record.thumbnail || undefined}
                        gradient={gradientByRecord.get(record)}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {groupedVinyl[letter].map((record, index) => (
                      <div
                        key={`${record.id || record.artist}-${record.title}-${index}`}
                        className="vinyl-list-row"
                      >
                        <span className="vinyl-list-row-title">{record.title || 'Unknown Title'}</span>
                        <span className="vinyl-list-row-artist">{record.artist || 'Unknown Artist'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .vinyl-edit-link {
          color: var(--color-accent-secondary);
          font-family: var(--font-body);
        }
      `}</style>
    </>
  );
}
