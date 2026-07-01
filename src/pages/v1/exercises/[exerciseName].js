import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import V1Layout from '../../../components/v1/V1Layout';
import ExerciseProgressCharts from '../../../components/ExerciseProgressCharts';
import CardioProgressCharts from '../../../components/CardioProgressCharts';
import { DATE_RANGES, filterByDateRange } from '../../../lib/dateRange';

export default function V1ExerciseDetailPage() {
  const router = useRouter();
  const { exerciseName } = router.query;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('1y');

  useEffect(() => {
    if (!exerciseName) return;
    let cancelled = false;

    async function fetchHistory() {
      try {
        const response = await fetch(`/api/exercises/history/${encodeURIComponent(exerciseName)}`);
        if (!response.ok) throw new Error('Failed to fetch exercise history');
        const data = await response.json();
        if (!cancelled) setHistory(data.history || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [exerciseName]);

  const filteredHistory = useMemo(
    () => filterByDateRange(history, dateRange, (h) => h.workout_date),
    [history, dateRange],
  );

  const stats = useMemo(() => computeStats(filteredHistory), [filteredHistory]);

  return (
    <V1Layout breadcrumb={`~ / exercises / ${exerciseName || ''}`}>
      {loading && <p className="v1-status">Loading exercise history…</p>}
      {error && <p className="v1-status v1-status-error">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="v1-range-row">
            {DATE_RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                className={`v1-filter-pill${dateRange === range.key ? ' v1-filter-pill-active' : ''}`}
                onClick={() => setDateRange(range.key)}
              >
                {range.label}
              </button>
            ))}
          </div>

          {!history.length && <p className="v1-status">No history found for this exercise.</p>}

          {stats && (
            <div className="v1-info-table">
              <div className="v1-info-row">
                <span className="v1-info-label">Sessions</span>
                <span className="v1-numeric">{stats.totalSessions}</span>
              </div>

              {stats.exerciseType === 'strength' && (
                <>
                  <div className="v1-info-row">
                    <span className="v1-info-label">All-time max 1RM</span>
                    <span className="v1-numeric">{stats.allTimeMax1RM}kg</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">All-time max weight</span>
                    <span className="v1-numeric">{stats.allTimeMaxWeight}kg</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Max session volume</span>
                    <span className="v1-numeric">{stats.allTimeMaxVolume}kg</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Total volume</span>
                    <span className="v1-numeric">{stats.totalVolume.toLocaleString()}kg</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">1RM progress (recent)</span>
                    <span className="v1-numeric">
                      {stats.progress1RM > 0 ? '+' : ''}
                      {stats.progress1RM}%
                    </span>
                  </div>
                </>
              )}

              {stats.exerciseType === 'cardio' && (
                <>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Total distance</span>
                    <span className="v1-numeric">{(stats.totalDistance / 1000).toFixed(2)}km</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Total time</span>
                    <span className="v1-numeric">
                      {Math.floor(stats.totalDuration / 3600)}h {Math.floor((stats.totalDuration % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Max distance</span>
                    <span className="v1-numeric">{(stats.maxDistance / 1000).toFixed(2)}km</span>
                  </div>
                  <div className="v1-info-row">
                    <span className="v1-info-label">Avg distance</span>
                    <span className="v1-numeric">{(stats.averageDistance / 1000).toFixed(2)}km</span>
                  </div>
                </>
              )}
            </div>
          )}

          {!stats && history.length > 0 && (
            <p className="v1-status">No sessions in the selected date range.</p>
          )}

          {stats && stats.exerciseType === 'strength' && (
            <ExerciseProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
          )}

          {stats && stats.exerciseType === 'cardio' && (
            <CardioProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
          )}

          {filteredHistory.length > 0 && (
            <table className="v1-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Workout</th>
                  <th className="v1-numeric">Volume</th>
                  <th className="v1-numeric">Max wt.</th>
                  <th className="v1-numeric">Est. 1RM</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 20).map((session, i) => (
                  <tr key={session.exercise_id} className={i % 2 === 0 ? 'v1-row-even' : 'v1-row-odd'}>
                    <td>{new Date(session.workout_date).toLocaleDateString('en-GB')}</td>
                    <td>
                      <Link href={`/v1/workouts/${session.workout_id}`}>{session.workout_title}</Link>
                    </td>
                    <td className="v1-numeric">{session.sessionVolume != null ? `${session.sessionVolume}kg` : '—'}</td>
                    <td className="v1-numeric">{session.heaviestWeight != null ? `${session.heaviestWeight}kg` : '—'}</td>
                    <td className="v1-numeric">{session.bestEstimated1RM != null ? `${session.bestEstimated1RM}kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredHistory.length > 20 && (
            <p className="v1-status">Showing latest 20 of {filteredHistory.length} sessions</p>
          )}
        </>
      )}

      <style jsx>{`
        .v1-status {
          color: #6b7280;
          padding: 8px 0;
        }

        .v1-status-error {
          color: #f87171;
        }

        .v1-range-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .v1-filter-pill {
          background: #131618;
          border: 1px solid #24292b;
          color: #6b7280;
          font-family: inherit;
          font-size: 13px;
          padding: 4px 12px;
          cursor: pointer;
        }

        .v1-filter-pill-active {
          color: #6ee7b7;
          font-weight: 700;
          border-color: #6ee7b7;
        }

        .v1-info-table {
          margin-bottom: 16px;
          max-width: 420px;
        }

        .v1-info-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #1c2022;
        }

        .v1-info-label {
          color: #6b7280;
        }

        .v1-numeric {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .v1-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .v1-table th,
        .v1-table td {
          text-align: left;
          padding: 6px 10px;
          border-bottom: 1px solid #1c2022;
        }

        .v1-table th {
          font-weight: 700;
          color: #6ee7b7;
        }

        .v1-row-even {
          background: #101314;
        }

        .v1-row-odd {
          background: #0d0f10;
        }
      `}</style>
    </V1Layout>
  );
}

function computeStats(history) {
  if (!history.length) return null;

  const isStrengthExercise = history.some(
    (h) => h.exerciseType === 'strength' || (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0),
  );
  const isCardioExercise = history.some(
    (h) => h.exerciseType === 'cardio' || (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0)),
  );

  let relevantHistory = history;
  if (isStrengthExercise) {
    relevantHistory = history.filter((h) => {
      if (h.exerciseType === 'strength') return true;
      if (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0) return true;
      return false;
    });
  }

  if (!relevantHistory.length) return null;

  const totalSessions = relevantHistory.length;
  let result = {
    totalSessions,
    exerciseType: isStrengthExercise ? 'strength' : isCardioExercise ? 'cardio' : 'bodyweight',
  };

  if (isStrengthExercise) {
    const allTimeMax1RM = Math.max(...relevantHistory.map((h) => h.bestEstimated1RM || 0));
    const allTimeMaxWeight = Math.max(...relevantHistory.map((h) => h.heaviestWeight || 0));
    const allTimeMaxVolume = Math.max(...relevantHistory.map((h) => h.sessionVolume || 0));
    const totalVolume = relevantHistory.reduce((sum, h) => sum + (h.sessionVolume || 0), 0);

    const recent10 = relevantHistory.slice(0, 10);
    const previous10 = relevantHistory.slice(10, 20);
    const recentAvg1RM = recent10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / recent10.length;
    const previousAvg1RM = previous10.length
      ? previous10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / previous10.length
      : 0;
    const progress1RM = previous10.length ? ((recentAvg1RM - previousAvg1RM) / previousAvg1RM) * 100 : 0;

    result = {
      ...result,
      allTimeMax1RM: Math.round(allTimeMax1RM * 10) / 10,
      allTimeMaxWeight: Math.round(allTimeMaxWeight * 10) / 10,
      allTimeMaxVolume: Math.round(allTimeMaxVolume * 10) / 10,
      totalVolume: Math.round(totalVolume),
      progress1RM: Math.round(progress1RM * 10) / 10,
    };
  } else if (isCardioExercise) {
    const totalDistance = relevantHistory.reduce((sum, h) => sum + (h.totalDistance || 0), 0);
    const totalDuration = relevantHistory.reduce((sum, h) => sum + (h.totalDuration || 0), 0);
    const maxDistance = Math.max(...relevantHistory.map((h) => h.totalDistance || 0));

    result = {
      ...result,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration,
      maxDistance: Math.round(maxDistance * 10) / 10,
      averageDistance: totalSessions ? Math.round((totalDistance / totalSessions) * 10) / 10 : 0,
    };
  }

  return result;
}
