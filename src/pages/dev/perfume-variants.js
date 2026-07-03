import { useState, useEffect } from 'react';
import Variant1StatBlock from '../../components/perfumeVariants/Variant1StatBlock';
import Variant2Editorial from '../../components/perfumeVariants/Variant2Editorial';
import Variant3ShelfTile from '../../components/perfumeVariants/Variant3ShelfTile';
import Variant4SeasonPlanner from '../../components/perfumeVariants/Variant4SeasonPlanner';
import Variant5TableRow from '../../components/perfumeVariants/Variant5TableRow';

const MAX_ITEMS = 8;

const sectionStyle = {
  marginBottom: '3rem',
  paddingBottom: '2rem',
  borderBottom: '1px solid #ccc',
};

const headingStyle = {
  fontSize: '1.25rem',
  marginBottom: '1rem',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '1rem',
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Perfume card variants — side-by-side preview</h1>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Variant 1 — Stat Block</h2>
        <div style={gridStyle}>
          {perfumes.map((item) => (
            <Variant1StatBlock key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Variant 2 — Editorial</h2>
        <div style={gridStyle}>
          {perfumes.map((item) => (
            <Variant2Editorial key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Variant 3 — Shelf Tile</h2>
        <div style={gridStyle}>
          {perfumes.map((item) => (
            <Variant3ShelfTile key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Variant 4 — Season Planner</h2>
        <div style={gridStyle}>
          {perfumes.map((item) => (
            <Variant4SeasonPlanner key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Variant 5 — Table Row</h2>
        <div style={listStyle}>
          {perfumes.map((item) => (
            <Variant5TableRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
