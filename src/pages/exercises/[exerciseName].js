import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import ExerciseProgressCharts from '../../components/ExerciseProgressCharts';
import CardioProgressCharts from '../../components/CardioProgressCharts';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const { exerciseName } = router.query;
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!exerciseName) return;

    async function fetchExerciseHistory() {
      try {
        setLoading(true);
        const response = await fetch(`/api/exercises/history/${encodeURIComponent(exerciseName)}?limit=50`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch exercise history');
        }

        const data = await response.json();
        setExerciseHistory(data.history || []);
        
        // Calculate overall stats
        if (data.history && data.history.length > 0) {
          const history = data.history;
          
          // Determine exercise type from the data
          const isStrengthExercise = history.some(h => 
            h.exerciseType === 'strength' || 
            (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0)
          );
          
          const isCardioExercise = history.some(h => 
            h.exerciseType === 'cardio' || 
            (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0))
          );

          // Filter relevant history based on exercise type
          let relevantHistory = history;
          if (isStrengthExercise) {
            relevantHistory = history.filter(h => {
              // New data: explicitly marked as strength
              if (h.exerciseType === 'strength') return true;
              // Legacy data: infer from presence of weight-based metrics
              if (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0) return true;
              return false;
            });
          }
          
          if (relevantHistory.length > 0) {
            const totalSessions = relevantHistory.length;
            const firstSession = relevantHistory[relevantHistory.length - 1]?.workout_date;
            const lastSession = relevantHistory[0]?.workout_date;

            let stats = {
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
              
              // Recent progress (last 10 sessions vs previous 10)
              const recent10 = relevantHistory.slice(0, 10);
              const previous10 = relevantHistory.slice(10, 20);
              
              const recentAvg1RM = recent10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / recent10.length;
              const previousAvg1RM = previous10.length > 0 ? previous10.reduce((sum, h) => sum + (h.bestEstimated1RM || 0), 0) / previous10.length : 0;
              
              const progress1RM = previous10.length > 0 ? ((recentAvg1RM - previousAvg1RM) / previousAvg1RM) * 100 : 0;

              stats = {
                ...stats,
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
              
              stats = {
                ...stats,
                totalDistance: Math.round(totalDistance * 10) / 10,
                totalDuration,
                maxDistance: Math.round(maxDistance * 10) / 10,
                maxDuration,
                averageDistance: totalSessions > 0 ? Math.round((totalDistance / totalSessions) * 10) / 10 : 0,
                averageDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
              };
            }
            
            setStats(stats);
          }
        }

      } catch (err) {
        console.error('Error fetching exercise history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchExerciseHistory();
  }, [exerciseName]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Exercise Progress - ryankrol.co.uk</title>
        </Head>
        
        <div className="container">
          <Header />
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
          <Header />
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
          <Header />
          <h1 className="page-title">📊 {exerciseName}</h1>
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
        <Header />
        
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Workouts
          </button>
          
          <h1 className="page-title">📊 {exerciseName}</h1>
          
          {stats && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  TOTAL SESSIONS
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                  {stats.totalSessions}
                </div>
              </div>

              {stats.exerciseType === 'strength' && (
                <>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      ALL-TIME MAX 1RM
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {stats.allTimeMax1RM}kg
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      ALL-TIME MAX WEIGHT
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {stats.allTimeMaxWeight}kg
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      MAX SESSION VOLUME
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {stats.allTimeMaxVolume}kg
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      TOTAL VOLUME
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {stats.totalVolume.toLocaleString()}kg
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      1RM PROGRESS (RECENT)
                    </div>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: stats.progress1RM > 0 ? '#10b981' : stats.progress1RM < 0 ? '#ef4444' : '#6b7280' 
                    }}>
                      {stats.progress1RM > 0 ? '+' : ''}{stats.progress1RM}%
                    </div>
                  </div>
                </>
              )}

              {stats.exerciseType === 'cardio' && (
                <>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      TOTAL DISTANCE
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {(stats.totalDistance / 1000).toFixed(2)}km
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      TOTAL TIME
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {Math.floor(stats.totalDuration / 3600)}h {Math.floor((stats.totalDuration % 3600) / 60)}m
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      MAX DISTANCE
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {(stats.maxDistance / 1000).toFixed(2)}km
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      AVG DISTANCE
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                      {(stats.averageDistance / 1000).toFixed(2)}km
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {stats && stats.exerciseType === 'strength' && (
          <ExerciseProgressCharts 
            exerciseHistory={exerciseHistory} 
            exerciseName={exerciseName}
          />
        )}
        
        {stats && stats.exerciseType === 'cardio' && (
          <CardioProgressCharts 
            exerciseHistory={exerciseHistory} 
            exerciseName={exerciseName}
          />
        )}
        
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            📋 Session History
          </h2>
          
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {exerciseHistory.slice(0, 20).map((session, index) => {
              const isStrength = session.exerciseType === 'strength' || 
                               (!session.exerciseType && session.bestEstimated1RM > 0 && session.heaviestWeight > 0);
              const isCardio = session.exerciseType === 'cardio' || 
                             (!session.exerciseType && (session.totalDistance > 0 || session.totalDuration > 0));
              
              return (
                <div 
                  key={session.exercise_id}
                  style={{
                    padding: '1rem',
                    borderBottom: index < 19 && index < exerciseHistory.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'grid',
                    gridTemplateColumns: isStrength ? 'auto 1fr auto auto auto' : isCardio ? 'auto 1fr auto auto' : 'auto 1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {new Date(session.workout_date).toLocaleDateString()}
                  </div>
                  
                  <Link 
                    href={`/workouts/${session.workout_id}`}
                    style={{
                      fontSize: '0.9rem', 
                      fontWeight: '500',
                      textDecoration: 'none',
                      color: '#3b82f6',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.textDecoration = 'none';
                    }}
                  >
                    {session.workout_title}
                  </Link>
                  
                  {isStrength && (
                    <>
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <div style={{ color: '#6b7280' }}>Volume</div>
                        <div style={{ fontWeight: '500' }}>{session.sessionVolume}kg</div>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <div style={{ color: '#6b7280' }}>Max Weight</div>
                        <div style={{ fontWeight: '500' }}>{session.heaviestWeight}kg</div>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <div style={{ color: '#6b7280' }}>Est. 1RM</div>
                        <div style={{ fontWeight: '500' }}>{session.bestEstimated1RM}kg</div>
                      </div>
                    </>
                  )}
                  
                  {isCardio && (
                    <>
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <div style={{ color: '#6b7280' }}>Distance</div>
                        <div style={{ fontWeight: '500' }}>
                          {session.totalDistance ? `${(session.totalDistance / 1000).toFixed(2)}km` : '-'}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                        <div style={{ color: '#6b7280' }}>Duration</div>
                        <div style={{ fontWeight: '500' }}>
                          {session.totalDuration ? `${Math.floor(session.totalDuration / 60)}m ${session.totalDuration % 60}s` : '-'}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!isStrength && !isCardio && (
                    <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                      <div style={{ color: '#6b7280' }}>Sets</div>
                      <div style={{ fontWeight: '500' }}>{session.totalWorkingSets}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {exerciseHistory.length > 20 && (
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '0.9rem',
              marginTop: '1rem' 
            }}>
              Showing latest 20 of {exerciseHistory.length} sessions
            </p>
          )}
        </div>
      </div>
    </>
  );
}