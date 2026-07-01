import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import V2Layout from '../../../components/v2/V2Layout';
import ExerciseProgressCharts from '../../../components/ExerciseProgressCharts';
import CardioProgressCharts from '../../../components/CardioProgressCharts';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { filterByDateRange } from '../../../lib/dateRange';

export default function V2ExerciseDetail() {
  const router = useRouter();
  const { exerciseName } = router.query;
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('1y');

  useEffect(() => {
    if (!exerciseName) return;
    let cancelled = false;

    async function fetchExerciseHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/exercises/history/${encodeURIComponent(exerciseName)}`);
        if (!response.ok) throw new Error('Failed to fetch exercise history');
        const data = await response.json();
        if (!cancelled) setExerciseHistory(data.history || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExerciseHistory();
    return () => {
      cancelled = true;
    };
  }, [exerciseName]);

  const filteredHistory = useMemo(
    () => filterByDateRange(exerciseHistory, dateRange, (h) => h.workout_date),
    [exerciseHistory, dateRange]
  );

  const stats = useMemo(() => {
    if (!filteredHistory.length) return null;
    const isStrength = filteredHistory.some(
      (h) => h.exerciseType === 'strength' || (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0)
    );
    const isCardio = filteredHistory.some(
      (h) => h.exerciseType === 'cardio' || (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0))
    );
    const relevant = isStrength
      ? filteredHistory.filter(
          (h) => h.exerciseType === 'strength' || (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0)
        )
      : filteredHistory;
    if (!relevant.length) return null;

    const base = {
      totalSessions: relevant.length,
      exerciseType: isStrength ? 'strength' : isCardio ? 'cardio' : 'bodyweight',
    };

    if (isStrength) {
      return {
        ...base,
        allTimeMax1RM: Math.round(Math.max(...relevant.map((h) => h.bestEstimated1RM || 0)) * 10) / 10,
        totalVolume: Math.round(relevant.reduce((sum, h) => sum + (h.sessionVolume || 0), 0)),
      };
    }

    if (isCardio) {
      const totalDistance = relevant.reduce((sum, h) => sum + (h.totalDistance || 0), 0);
      const totalDuration = relevant.reduce((sum, h) => sum + (h.totalDuration || 0), 0);
      return { ...base, totalDistance, totalDuration };
    }

    return base;
  }, [filteredHistory]);

  return (
    <V2Layout>
      <div className="v2-article-shell">
        {loading && <p className="v2-status">Loading exercise history…</p>}
        {error && <p className="v2-status v2-error">Error: {error}</p>}
        {!loading && !error && !exerciseHistory.length && <p className="v2-status">No history found for this exercise.</p>}

        {!loading && !error && exerciseHistory.length > 0 && (
          <>
            <span className="v2-hero-kicker">Exercise progress</span>
            <h1 className="v2-article-headline">{exerciseName}</h1>

            <div className="v2-range-row">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>

            {stats ? (
              <p className="v2-byline">
                {stats.totalSessions} sessions logged
                {stats.exerciseType === 'strength' &&
                  ` — all-time best estimated 1RM ${stats.allTimeMax1RM}kg, total volume ${stats.totalVolume.toLocaleString()}kg`}
                {stats.exerciseType === 'cardio' &&
                  ` — total distance ${(stats.totalDistance / 1000).toFixed(2)}km over ${Math.floor(stats.totalDuration / 3600)}h ${Math.floor((stats.totalDuration % 3600) / 60)}m`}
              </p>
            ) : (
              <p className="v2-byline">No sessions in the selected date range.</p>
            )}

            {stats && stats.exerciseType === 'strength' && (
              <div className="v2-chart-block">
                <ExerciseProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
              </div>
            )}

            {stats && stats.exerciseType === 'cardio' && (
              <div className="v2-chart-block">
                <CardioProgressCharts exerciseHistory={filteredHistory} exerciseName={exerciseName} />
              </div>
            )}

            <h2 className="v2-section-heading">Session history</h2>
            <div className="v2-history-list">
              {filteredHistory.slice(0, 20).map((session) => (
                <div key={session.exercise_id} className="v2-history-row">
                  <span className="v2-history-date">{new Date(session.workout_date).toLocaleDateString()}</span>
                  <Link href={`/v2/workouts/${session.workout_id}`} className="v2-history-link">
                    {session.workout_title}
                  </Link>
                  <span className="v2-history-figure">
                    {session.bestEstimated1RM > 0
                      ? `${session.bestEstimated1RM}kg 1RM`
                      : session.totalDistance > 0
                      ? `${(session.totalDistance / 1000).toFixed(2)}km`
                      : `${session.totalWorkingSets || 0} sets`}
                  </span>
                </div>
              ))}
            </div>
            {filteredHistory.length > 20 && (
              <p className="v2-status" style={{ textAlign: 'center' }}>
                Showing latest 20 of {filteredHistory.length} sessions
              </p>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .v2-article-shell {
          max-width: 680px;
          margin: 0 auto;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-article-headline {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.75rem;
          margin: 8px 0 16px;
          line-height: 1.1;
        }

        .v2-range-row {
          margin-bottom: 16px;
        }

        .v2-byline {
          font-size: 0.95rem;
          color: #8a8474;
          margin: 0 0 32px;
        }

        .v2-chart-block {
          margin-bottom: 40px;
        }

        .v2-section-heading {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.6rem;
          margin: 0 0 16px;
        }

        .v2-history-list {
          display: flex;
          flex-direction: column;
        }

        .v2-history-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #d8d3c4;
          font-size: 0.9rem;
        }

        .v2-history-date {
          color: #8a8474;
          font-size: 0.8rem;
        }

        .v2-history-link {
          color: #211f1c;
          text-decoration: none;
        }

        .v2-history-link:hover {
          text-decoration: underline;
        }

        .v2-history-figure {
          font-weight: 600;
          text-align: right;
        }
      `}</style>
    </V2Layout>
  );
}
