import { useState, useEffect } from 'react';
import Variant1StatBlock from '../../components/perfumeVariants/Variant1StatBlock';
import Variant2Editorial from '../../components/perfumeVariants/Variant2Editorial';
import Variant3ShelfTile from '../../components/perfumeVariants/Variant3ShelfTile';
import Variant4SeasonPlanner from '../../components/perfumeVariants/Variant4SeasonPlanner';
import Variant6Hybrid from '../../components/perfumeVariants/Variant6Hybrid';

const MAX_ITEMS = 8;

const VARIANTS = [
  { key: 'v1', label: 'Variant 1 — Stat Block', Component: Variant1StatBlock },
  { key: 'v2', label: 'Variant 2 — Editorial', Component: Variant2Editorial },
  { key: 'v3', label: 'Variant 3 — Shelf Tile', Component: Variant3ShelfTile },
  { key: 'v4', label: 'Variant 4 — Season Planner', Component: Variant4SeasonPlanner },
  { key: 'v6', label: 'Variant 6 — Hybrid (1 + 4)', Component: Variant6Hybrid },
];

const rowStyle = {
  marginBottom: '3rem',
  paddingBottom: '2rem',
  borderBottom: '1px solid #ccc',
};

const perfumeHeadingStyle = {
  fontSize: '1.1rem',
  marginBottom: '1rem',
};

const COLUMNS_PER_ROW = 3;

const compareGridStyle = {
  display: 'grid',
  gridTemplateColumns: `repeat(${COLUMNS_PER_ROW}, minmax(260px, 1fr))`,
  gap: '1.5rem',
  alignItems: 'start',
};

const columnLabelStyle = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: '0.5rem',
  textAlign: 'center',
};

export default function PerfumeVariantsPreview() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPerfumes() {
      try {
        const response = await fetch('/api/reviews/perfumes');
        if (!response.ok) throw new Error('Failed to fetch perfumes');
        const data = await response.json();
        setPerfumes(data.slice(0, MAX_ITEMS));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfumes();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>;
  if (error) return <div style={{ padding: '2rem' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', overflowX: 'auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Perfume card variants — side-by-side preview</h1>

      {perfumes.map((item) => (
        <section key={item.id} style={rowStyle}>
          <h2 style={perfumeHeadingStyle}>
            {item.title} — {item.designer}
          </h2>
          <div style={compareGridStyle}>
            {VARIANTS.map(({ key, label, Component }) => (
              <div key={key}>
                <p style={columnLabelStyle}>{label}</p>
                <Component item={item} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
