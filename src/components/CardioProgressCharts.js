import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CardioProgressCharts({ exerciseHistory, exerciseName }) {
  // Filter only cardio exercises and reverse to get chronological order
  const cardioHistory = exerciseHistory
    .filter(h => {
      // New data: explicitly marked as cardio
      if (h.exerciseType === 'cardio' && (h.totalDistance > 0 || h.totalDuration > 0)) {
        return true;
      }
      
      // Legacy data: infer from presence of cardio metrics
      if (!h.exerciseType && (h.totalDistance > 0 || h.totalDuration > 0)) {
        console.log(`📊 [CHARTS] Inferring cardio exercise for legacy data: ${exerciseName}`);
        return true;
      }
      
      return false;
    })
    .reverse(); // Oldest first for chronological charts

  if (cardioHistory.length < 2) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#6b7280'
      }}>
        <p>Need at least 2 cardio sessions to show progress charts.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Current sessions: {cardioHistory.length}
        </p>
      </div>
    );
  }

  // Prepare data for charts
  const labels = cardioHistory.map(h => new Date(h.workout_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }));

  const distanceData = cardioHistory.map(h => h.totalDistance ? h.totalDistance / 1000 : 0); // Convert to km
  const durationData = cardioHistory.map(h => h.totalDuration ? h.totalDuration / 60 : 0); // Convert to minutes
  const paceData = cardioHistory.map(h => {
    // Calculate pace (minutes per km)
    if (h.totalDistance > 0 && h.totalDuration > 0) {
      const distanceKm = h.totalDistance / 1000;
      const durationMins = h.totalDuration / 60;
      return durationMins / distanceKm;
    }
    return 0;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          color: '#6b7280',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10
          }
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.1
      }
    }
  };

  const distanceChartData = {
    labels,
    datasets: [
      {
        label: 'Distance (km)',
        data: distanceData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const durationChartData = {
    labels,
    datasets: [
      {
        label: 'Duration (minutes)',
        data: durationData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const paceChartData = {
    labels,
    datasets: [
      {
        label: 'Pace (min/km)',
        data: paceData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const ChartCard = ({ title, children, color = '#374151' }) => (
    <div style={{ 
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ 
        fontSize: '1.1rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        color: color,
        display: 'flex',
        alignItems: 'center'
      }}>
        {title}
      </h3>
      <div style={{ height: '250px', width: '100%' }}>
        {children}
      </div>
    </div>
  );

  // Check if we have meaningful pace data (distance and duration both exist)
  const hasPaceData = paceData.some(pace => pace > 0);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        📈 Progress Charts
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: hasPaceData ? 'repeat(auto-fit, minmax(400px, 1fr))' : 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <ChartCard title="📏 Distance Progress" color="#3b82f6">
          <Line data={distanceChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="⏱️ Duration Progress" color="#10b981">
          <Line data={durationChartData} options={chartOptions} />
        </ChartCard>

        {hasPaceData && (
          <ChartCard title="🏃 Pace Progress" color="#f59e0b">
            <Line data={paceChartData} options={chartOptions} />
          </ChartCard>
        )}
      </div>

      {/* Summary insights */}
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          📋 Progress Insights
        </h3>
        
        <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>
          <p>
            <strong>Sessions analyzed:</strong> {cardioHistory.length} cardio sessions
          </p>
          <p>
            <strong>Distance improvement:</strong> {distanceData[0].toFixed(2)}km → {distanceData[distanceData.length - 1].toFixed(2)}km 
            ({distanceData.length > 1 ? (((distanceData[distanceData.length - 1] - distanceData[0]) / distanceData[0]) * 100).toFixed(1) : '0'}% change)
          </p>
          <p>
            <strong>Duration improvement:</strong> {durationData[0].toFixed(1)}min → {durationData[durationData.length - 1].toFixed(1)}min 
            ({durationData.length > 1 ? (((durationData[durationData.length - 1] - durationData[0]) / durationData[0]) * 100).toFixed(1) : '0'}% change)
          </p>
          {hasPaceData && (
            <p>
              <strong>Pace improvement:</strong> {paceData[0].toFixed(2)} → {paceData[paceData.length - 1].toFixed(2)} min/km 
              ({paceData.length > 1 ? (((paceData[0] - paceData[paceData.length - 1]) / paceData[0]) * 100).toFixed(1) : '0'}% faster)
            </p>
          )}
          <p>
            <strong>Average distance:</strong> {(distanceData.reduce((sum, d) => sum + d, 0) / distanceData.length).toFixed(2)}km
          </p>
          <p>
            <strong>Average duration:</strong> {(durationData.reduce((sum, d) => sum + d, 0) / durationData.length).toFixed(1)}min
          </p>
        </div>
      </div>
    </div>
  );
}