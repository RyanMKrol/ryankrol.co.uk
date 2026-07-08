import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ExerciseProgressCharts from '../../components/ExerciseProgressCharts';
import CardioProgressCharts from '../../components/CardioProgressCharts';
import PillGroup from '../../components/PillGroup';
import StatBlock from '../../components/StatBlock';
import { DATE_RANGES, filterByDateRange } from '../../lib/dateRange';
import { formatEnglishDate } from '../../lib/dateFormat';

const DATE_RANGE_OPTIONS = DATE_RANGES.map((range) => ({ value: range.key, label: range.label }));

const SPLIT_COLORS = {
  push: 'var(--split-push)',
  pull: 'var(--split-pull)',
  legs: 'var(--split-legs)',
};

function splitForTitle(title) {
  const lower = (title || '').toLowerCase();
  return Object.keys(SPLIT_COLORS).find((key) => lower.includes(key));
}

export default function ExerciseDetailPage() {
  const router = useRouter();
  const { exerciseName } = router.query;
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('1y');

  useEffect(() => {
    if (!exerciseName) return;

    async function fetchExerciseHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/exercises/history/${encodeURIComponent(exerciseName)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch exercise history');
        }

        const data = await response.json();
        setExerciseHistory(data.history || []);
      } catch (err) {
        console.error('Error fetching exercise history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExerciseHistory();
  }, [exerciseName]);

  const filteredHistory = useMemo(() => {
    return filterByDateRange(exerciseHistory, dateRange, (h) => h.workout_date);
  }, [exerciseHistory, dateRange]);

  const stats = useMemo(() => {
    if (!filteredHistory.length) return null;

    const history = filteredHistory;

    const isStrengthExercise = history.some(h =>
      h.exerciseType === 'strength' ||
      (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0)
    );

    const isCardioExercise = history.some(h =>
      h.exerciseType === 'cardio' ||
      (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0))
    );

    let relevantHistory = history;
    if (isStrengthExercise) {
      relevantHistory = history.filter(h => {
        if (h.exerciseType === 'strength') return true;
        if (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0) return true;
        return false;
      });
    }

    if (!relevantHistory.length) return null;

    const totalSessions = relevantHistory.length;
    const firstSession = relevantHistory[relevantHistory.length - 1]?.workout_date;
    const lastSession = relevantHistory[0]?.workout_date;

    let result = {
      totalSessions,
      firstSession,
      lastSession,
      exerciseType: isStrengthExercise ? 'strength' : isCardioExercise ? 'cardio' : 'bodyweight'
    };

    if (isStrengthExercise) {
      const allTimeMax1RM = Math.max(...relevantHistory.map(h => h.bestEstimated1RM || 0));
      const allTimeMaxWeight = Math.max(...relevantHistory.map(h => h.heaviestWeight || 0));
      const allTimeMaxVolume = Math.max(...relevantHistory.map(h => h.sessionVolume || 0));
      const totalVolume = relevantHistory.reduce((sum, h) => sum + (h.sessionVolume || 0), 0);

      const recent10 = relevantHistory.slice(0, 10);
      const previous10 = relevantHistory.slice(10, 20);

      const recentAvg1RM = recent10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / recent10.length;
      const previousAvg1RM = previous10.length > 0 ? previous10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / previous10.length : 0;
      const progress1RM = previous10.length > 0 ? ((recentAvg1RM - previousAvg1RM) / previousAvg1RM) * 100 : 0;

      result = {
        ...result,
        allTimeMax1RM: Math.round(allTimeMax1RM * 10) / 10,
        allTimeMaxWeight: Math.round(allTimeMaxWeight * 10) / 10,
        allTimeMaxVolume: Math.round(allTimeMaxVolume * 10) / 10,
        totalVolume: Math.round(totalVolume),
        averageVolume: Math.round(totalVolume / totalSessions),
        progress1RM: Math.round(progress1RM * 10) / 10
      };
    } else if (isCardioExercise) {
      const totalDistance = relevantHistory.reduce((sum, h) => sum + (h.totalDistance || 0), 0);
      const totalDuration = relevantHistory.reduce((sum, h) => sum + (h.totalDuration || 0), 0);
      const maxDistance = Math.max(...relevantHistory.map(h => h.totalDistance || 0));
      const maxDuration = Math.max(...relevantHistory.map(h => h.totalDuration || 0));

      result = {
        ...result,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalDuration,
        maxDistance: Math.round(maxDistance * 10) / 10,
        maxDuration,
        averageDistance: totalSessions > 0 ? Math.round((totalDistance / totalSessions) * 10) / 10 : 0,
        averageDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
      };
    }

    return result;
  }, [filteredHistory]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Exercise Progress - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading exercise history...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Exercise Progress - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <div className="loading-container">
            <p className="error-text">Error: {error}</p>
            <button
              onClick={() => router.back()}
              className="form-button"
              style={{ marginTop: '1rem' }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!exerciseHistory.length) {
    return (
      <>
        <Head>
          <title>{exerciseName} Progress - ryankrol.co.uk</title>
        </Head>

        <div className="container">
          <h1 className="page-title">{exerciseName}</h1>
          <p>No history found for this exercise.</p>
          <button
            onClick={() => router.back()}
            className="form-button"
            style={{ marginTop: '1rem' }}
          >
            ← Go Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{exerciseName} Progress - ryankrol.co.uk</title>
      </Head>

      <div className="container">

        <Link href="/workouts" className="collection-back-link">
          ← back to workouts
        </Link>

        <h1 className="page-title" style={{ marginBottom: '1rem' }}>{exerciseName}</h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <PillGroup options={DATE_RANGE_OPTIONS} value={dateRange} onChange={setDateRange} />
        </div>

        {stats && stats.exerciseType === 'strength' && (
          <div className="exercise-detail-stats">
            <StatBlock value={stats.totalSessions} label="sessions" />
            <StatBlock
              value={stats.allTimeMax1RM}
              unit="kg"
              label="all-time 1RM"
              accentColor="var(--accent-movies)"
            />
            <StatBlock value={stats.allTimeMaxWeight} unit="kg" label="max weight" />
            <StatBlock value={stats.totalVolume.toLocaleString()} unit="kg" label="total volume" />
            <StatBlock
              value={`${stats.progress1RM > 0 ? '+' : ''}${stats.progress1RM}%`}
              label="1RM progress"
              accentColor="var(--accent-books)"
            />
          </div>
        )}

        {stats && stats.exerciseType === 'cardio' && (
          <div className="exercise-detail-stats">
            <StatBlock value={stats.totalSessions} label="sessions" />
            <StatBlock value={(stats.totalDistance / 1000).toFixed(2)} unit="km" label="total distance" />
            <StatBlock
              value={`${Math.floor(stats.totalDuration / 3600)}h ${Math.floor((stats.totalDuration % 3600) / 60)}m`}
              label="total time"
            />
            <StatBlock value={(stats.maxDistance / 1000).toFixed(2)} unit="km" label="max distance" />
            <StatBlock value={(stats.averageDistance / 1000).toFixed(2)} unit="km" label="avg distance" />
          </div>
        )}

        {!stats && !loading && (
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            No sessions in the selected date range.
          </p>
        )}

        {stats && stats.exerciseType === 'strength' && (
          <ExerciseProgressCharts
            exerciseHistory={filteredHistory}
            exerciseName={exerciseName}
          />
        )}

        {stats && stats.exerciseType === 'cardio' && (
          <CardioProgressCharts
            exerciseHistory={filteredHistory}
            exerciseName={exerciseName}
          />
        )}

        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Recent Sessions
          </h2>

          <table className="exercise-sessions-table">
            <thead>
              <tr>
                <th>Date / Split</th>
                <th>Volume</th>
                <th>Max Wt</th>
                <th>Est. 1RM</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.slice(0, 20).map((session) => {
                const isStrength = session.exerciseType === 'strength' ||
                  (!session.exerciseType && session.bestEstimated1RM > 0 && session.heaviestWeight > 0);
                const isCardio = session.exerciseType === 'cardio' ||
                  (!session.exerciseType && (session.totalDistance > 0 || session.totalDuration > 0));
                const split = splitForTitle(session.workout_title);

                return (
                  <tr key={session.exercise_id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
                        <Link href={`/workouts/${session.workout_id}`} className="session-link">
                          {formatEnglishDate(session.workout_date)}
                        </Link>
                        <span
                          className="text-muted"
                          style={{ fontSize: '0.75rem', color: split ? SPLIT_COLORS[split] : undefined }}
                        >
                          {session.workout_title}
                        </span>
                      </div>
                    </td>
                    {isStrength && (
                      <>
                        <td>{session.sessionVolume}kg</td>
                        <td>{session.heaviestWeight}kg</td>
                        <td>{session.bestEstimated1RM}kg</td>
                      </>
                    )}
                    {isCardio && (
                      <>
                        <td>{session.totalDistance ? `${(session.totalDistance / 1000).toFixed(2)}km` : '-'}</td>
                        <td>{session.totalDuration ? `${Math.floor(session.totalDuration / 60)}m ${session.totalDuration % 60}s` : '-'}</td>
                        <td>-</td>
                      </>
                    )}
                    {!isStrength && !isCardio && (
                      <>
                        <td>{session.totalWorkingSets} sets</td>
                        <td>-</td>
                        <td>-</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredHistory.length > 20 && (
            <p className="text-muted" style={{
              textAlign: 'center',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}>
              Showing latest 20 of {filteredHistory.length} sessions
            </p>
          )}
        </div>
      </div>
    </>
  );
}
