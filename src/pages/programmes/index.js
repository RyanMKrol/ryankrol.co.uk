import { useState, useEffect, useMemo } from 'react';
import Header from '../../components/Header';
import ProgrammeOverviewCharts from '../../components/ProgrammeOverviewCharts';
import DateRangeFilter from '../../components/DateRangeFilter';
import { aggregateProgramme } from '../../lib/programmeStats';
import { filterByDateRange } from '../../lib/dateRange';

const PROGRAMMES = ['push', 'pull', 'legs'];
const FILTER_OPTIONS = ['all', ...PROGRAMMES];

export default function Programmes() {
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState('push');
  const [dateRange, setDateRange] = useState('1y');

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true);
        const response = await fetch('/api/workouts?mode=all');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch workouts');
        }
        const result = await response.json();
        setAllWorkouts(result.workouts || []);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkouts();
  }, []);

  const filteredWorkouts = useMemo(
    () => filterByDateRange(allWorkouts, dateRange, (w) => w.start_time),
    [allWorkouts, dateRange]
  );

  const data = useMemo(
    () => aggregateProgramme(filteredWorkouts, selected),
    [filteredWorkouts, selected]
  );

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading workouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">programmes</h1>

      <div className="search-container">
        <div className="workout-filters">
          <span className="filter-label">Programme:</span>
          <div className="filter-buttons">
            {FILTER_OPTIONS.map(p => (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={`filter-button ${selected === p ? 'active' : ''}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="workout-filters" style={{ marginTop: '0.75rem' }}>
          <span className="filter-label">Period:</span>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totals.workouts}</div>
          <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Workouts</div>
        </div>
        <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {totals.totalVolume.toLocaleString()}
          </div>
          <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Volume (kg)</div>
        </div>
        <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            {totals.avgVolumePerWorkout.toLocaleString()}
          </div>
          <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Avg Volume / Session (kg)</div>
        </div>
      </div>

      <ProgrammeOverviewCharts data={data} />
    </div>
  );
}
