import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import V3Layout from './V3Layout';
import ExerciseProgressCharts from '../ExerciseProgressCharts';
import CardioProgressCharts from '../CardioProgressCharts';
import { DATE_RANGES, filterByDateRange } from '../../lib/dateRange';

function isStrengthSession(h) {
  return h.exerciseType === 'strength' || (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0);
}

function isCardioSession(h) {
  return h.exerciseType === 'cardio' || (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0));
}

export default function V3ExerciseDetail({ exerciseName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('1y');

  useEffect(() => {
    if (!exerciseName) return;

    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/exercises/history/${encodeURIComponent(exerciseName)}`);
        if (!response.ok) throw new Error('Failed to fetch exercise history');
        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [exerciseName]);

  const filteredHistory = useMemo(
    () => filterByDateRange(history, dateRange, (h) => h.workout_date),
    [history, dateRange]
  );

  const exerciseType = useMemo(() => {
    if (filteredHistory.some(isStrengthSession)) return 'strength';
    if (filteredHistory.some(isCardioSession)) return 'cardio';
    return 'bodyweight';
  }, [filteredHistory]);

  return (
    <V3Layout title={exerciseName || 'exercise'}>
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}
      {!loading && !error && !history.length && <p className="v3-status">no history found for this exercise.</p>}

      {!loading && !error && !!history.length && (
        <>
          <p className="v3-sort">
            range:{' '}
            {DATE_RANGES.map((range, i) => (
              <span key={range.key}>
                <button
                  type="button"
                  className={`v3-filter-link ${dateRange === range.key ? 'v3-filter-active' : ''}`}
                  onClick={() => setDateRange(range.key)}
                >
                  {range.label}
                </button>
                {i < DATE_RANGES.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>

          {!filteredHistory.length && <p className="v3-status">no sessions in the selected range.</p>}

          {!!filteredHistory.length && exerciseType === 'strength' && (
            <ExerciseProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
          )}

          {!!filteredHistory.length && exerciseType === 'cardio' && (
            <CardioProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
          )}

          {filteredHistory.map((session) => (
            <div className="v3-row" key={session.exercise_id}>
              <div className="v3-gutter">{new Date(session.workout_date).toLocaleDateString('en-GB')}</div>
              <div className="v3-body">
                <p>
                  <Link href={`/v3/workouts/${session.workout_id}`}>{session.workout_title}</Link>
                </p>
                {isStrengthSession(session) && (
                  <p className="v3-muted">
                    volume {session.sessionVolume}kg · max weight {session.heaviestWeight}kg · est. 1RM {session.bestEstimated1RM}kg
                  </p>
                )}
                {isCardioSession(session) && (
                  <p className="v3-muted">
                    {session.totalDistance ? `${(session.totalDistance / 1000).toFixed(2)}km` : '-'} ·{' '}
                    {session.totalDuration ? `${Math.floor(session.totalDuration / 60)}m ${session.totalDuration % 60}s` : '-'}
                  </p>
                )}
                {!isStrengthSession(session) && !isCardioSession(session) && (
                  <p className="v3-muted">sets: {session.totalWorkingSets}</p>
                )}
              </div>
            </div>
          ))}

          <div className="v3-end">— end of feed —</div>
        </>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }

        .v3-sort {
          color: #767672;
          margin: 14px 0;
        }

        .v3-filter-link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: #767672;
          text-decoration: underline;
          cursor: pointer;
        }

        .v3-filter-active {
          color: #1a1a1a;
          font-weight: 600;
          text-decoration: none;
        }

        .v3-row {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #ececea;
        }

        .v3-gutter {
          flex: 0 0 84px;
          color: #767672;
        }

        .v3-body {
          flex: 1;
          min-width: 0;
        }

        .v3-body p {
          margin: 0 0 4px 0;
        }

        .v3-muted {
          color: #767672;
        }

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
