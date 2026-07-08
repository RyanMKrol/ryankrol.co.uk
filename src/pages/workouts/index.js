import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Badge, { PrBadge } from '../../components/Badge';
import PillGroup from '../../components/PillGroup';
import Pagination from '../../components/Pagination';
import MasonryColumns from '../../components/MasonryColumns';
import DateRangeFilter from '../../components/DateRangeFilter';
import ProgrammeOverviewCharts from '../../components/ProgrammeOverviewCharts';
import useResponsiveColumnCount from '../../hooks/useResponsiveColumnCount';
import { paginate } from '../../lib/pagination';
import { filterWorkouts } from '../../lib/workoutPagination';
import { formatEnglishDate } from '../../lib/dateFormat';
import { aggregateProgramme } from '../../lib/programmeStats';
import { filterByDateRange } from '../../lib/dateRange';

const PAGE_SIZE = 10;

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
];

const SPLIT_COLORS = {
  push: 'var(--split-push)',
  pull: 'var(--split-pull)',
  legs: 'var(--split-legs)',
};

function splitForTitle(title) {
  const lower = (title || '').toLowerCase();
  return Object.keys(SPLIT_COLORS).find((key) => lower.includes(key));
}

function splitColorForTitle(title) {
  const split = splitForTitle(title);
  return split ? SPLIT_COLORS[split] : 'var(--color-ink-mute)';
}

function formatDate(dateString) {
  return formatEnglishDate(dateString);
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getDuration(startTime, endTime) {
  const diffMins = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
}

export function getExercisePreview(exercises = [], maxShown = 3) {
  const previews = exercises
    .filter((exercise) => exercise.title)
    .map((exercise) => {
      const sets = exercise.sets || [];
      const prAxes = [
        sets.some((set) => set.isWeightPR) && { key: 'weight', label: 'Weight', ariaLabel: 'weight personal best' },
        sets.some((set) => set.is1RMPR) && { key: '1rm', label: '1RM', ariaLabel: '1RM personal best' },
        sets.some((set) => set.isVolumePR) && { key: 'volume', label: 'Volume', ariaLabel: 'volume personal best' },
      ].filter(Boolean);
      return { name: exercise.title, prAxes };
    });
  const shown = previews.slice(0, maxShown);
  const remaining = previews.length - shown.length;
  return { shown, remaining };
}

function getTotalVolume(exercises = []) {
  return exercises.reduce((total, exercise) => (
    total + exercise.sets.reduce((setTotal, set) => (
      set.type !== 'warmup' && set.weight_kg && set.reps
        ? setTotal + set.weight_kg * set.reps
        : setTotal
    ), 0)
  ), 0);
}

export function formatVolumeKg(volumeKg) {
  return `${Math.round(volumeKg)}`;
}

export default function Workouts() {
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('1y');
  const columnCount = useResponsiveColumnCount(2, 900);

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

  const filtered = filterWorkouts(allWorkouts, activeFilter);
  const { items: pageWorkouts, page, pageCount } = paginate(filtered, currentPage, PAGE_SIZE);

  const statsWorkouts = useMemo(
    () => filterByDateRange(allWorkouts, dateRange, (w) => w.start_time),
    [allWorkouts, dateRange]
  );
  const statsData = useMemo(
    () => aggregateProgramme(statsWorkouts, activeFilter),
    [statsWorkouts, activeFilter]
  );

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="review-container">
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
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
          <p>We&apos;re working on connecting to the Hevy API. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Workouts - ryankrol.co.uk</title>
      </Head>

      <div className="container">

        <div className="collection-review-header">
          <div className="collection-review-title-group">
            <h1 className="page-title">workouts</h1>
            <p className="collection-review-meta">
              {allWorkouts.length} sessions logged · via Hevy
            </p>
          </div>

          <div className="collection-review-controls">
            <PillGroup
              options={FILTER_OPTIONS}
              value={activeFilter}
              onChange={handleFilterChange}
              accentColor="var(--accent-workouts)"
            />
          </div>
        </div>

        <div className="search-container">
          <div className="workout-filters">
            <span className="filter-label">Period:</span>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
          <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{statsData.totals.workouts}</div>
            <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Workouts</div>
          </div>
          <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
              {statsData.totals.totalVolume.toLocaleString()}
            </div>
            <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Volume (kg)</div>
          </div>
          <div className="chart-card" style={{ flex: '1', minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
              {statsData.totals.avgVolumePerWorkout.toLocaleString()}
            </div>
            <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Avg Volume / Session (kg)</div>
          </div>
        </div>

        <ProgrammeOverviewCharts data={statsData} />

        {pageWorkouts.length === 0 ? (
          <p>No workouts found matching your filter.</p>
        ) : (
          <MasonryColumns
            items={pageWorkouts}
            columnCount={columnCount}
            className="workout-session-grid"
            columnClassName="workout-session-grid-col"
            renderItem={(workout, index) => {
              const exercises = workout.exercises || [];
              const { shown, remaining } = getExercisePreview(exercises);
              return (
                <Link
                  key={workout.id || index}
                  href={`/workouts/${workout.id}`}
                  className="workout-session-card"
                >
                  <div className="workout-session-card-top">
                    <h3 className="workout-session-title">{workout.title || 'Untitled Workout'}</h3>
                    <Badge accentColor={splitColorForTitle(workout.title)} variant="solid">
                      {splitForTitle(workout.title) || 'workout'}
                    </Badge>
                  </div>

                  <p className="workout-session-datetime">
                    {formatDate(workout.start_time)} · {formatTime(workout.start_time)} -{' '}
                    {formatTime(workout.end_time)} · {getDuration(workout.start_time, workout.end_time)}
                  </p>

                  {shown.length > 0 && (
                    <div className="workout-session-exercise-row">
                      <ul className="workout-session-exercise-list">
                        {shown.map(({ name, prAxes }) => (
                          <li key={name} className="workout-session-exercise-item">
                            {name}
                            {prAxes.map(({ key, label, ariaLabel }) => (
                              <PrBadge key={key} label={label} ariaLabel={ariaLabel} />
                            ))}
                          </li>
                        ))}
                        {remaining > 0 && (
                          <li className="workout-session-exercise-item workout-session-exercise-more">
                            +{remaining} more
                          </li>
                        )}
                      </ul>
                      <span className="workout-session-volume">
                        <span className="workout-session-volume-value">
                          {formatVolumeKg(getTotalVolume(exercises))}kg
                        </span>
                        <span className="workout-session-volume-label">volume</span>
                      </span>
                    </div>
                  )}

                  <div className="workout-session-stats">
                    <span className="workout-session-stat">
                      <span className="workout-session-stat-value">{exercises.length}</span>
                      <span className="workout-session-stat-label">exercises</span>
                    </span>
                  </div>
                </Link>
              );
            }}
          />
        )}

        <Pagination
          currentPage={page}
          totalPages={pageCount}
          onPageChange={setCurrentPage}
          accentColor="var(--accent-workouts)"
        />
      </div>
    </>
  );
}
