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

export default function ExerciseProgressCharts({ exerciseHistory, exerciseName }) {
  // Filter only strength exercises and reverse to get chronological order
  // Handle both new data (with exerciseType) and legacy data (without exerciseType)
  const strengthHistory = exerciseHistory
    .filter(h => {
      // New data: explicitly marked as strength
      if (h.exerciseType === 'strength' && h.bestEstimated1RM > 0) {
        return true;
      }
      
      // Legacy data: infer from presence of weight-based metrics
      if (!h.exerciseType && h.bestEstimated1RM > 0 && h.heaviestWeight > 0) {
        console.log(`📊 [CHARTS] Inferring strength exercise for legacy data: ${exerciseName}`);
        return true;
      }
      
      return false;
    })
    .reverse(); // Oldest first for chronological charts

  if (strengthHistory.length < 2) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#6b7280'
      }}>
        <p>Need at least 2 strength training sessions to show progress charts.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Current sessions: {strengthHistory.length}
        </p>
      </div>
    );
  }

  // Prepare data for charts
  const labels = strengthHistory.map(h => new Date(h.workout_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }));

  const oneRMData = strengthHistory.map(h => h.bestEstimated1RM);
  const maxWeightData = strengthHistory.map(h => h.heaviestWeight);
  const volumeData = strengthHistory.map(h => h.sessionVolume);
  const workingSetsData = strengthHistory.map(h => h.totalWorkingSets);

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

  const oneRMChartData = {
    labels,
    datasets: [
      {
        label: 'Estimated 1RM (kg)',
        data: oneRMData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const maxWeightChartData = {
    labels,
    datasets: [
      {
        label: 'Max Weight (kg)',
        data: maxWeightData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const volumeChartData = {
    labels,
    datasets: [
      {
        label: 'Session Volume (kg)',
        data: volumeData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const workingSetsChartData = {
    labels,
    datasets: [
      {
        label: 'Working Sets',
        data: workingSetsData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
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

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        📈 Progress Charts
      </h2>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <ChartCard title="🎯 Estimated 1RM Progress" color="#3b82f6">
          <Line data={oneRMChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="💪 Max Weight Progress" color="#10b981">
          <Line data={maxWeightChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="📊 Session Volume" color="#f59e0b">
          <Line data={volumeChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="🔢 Working Sets" color="#8b5cf6">
          <Line data={workingSetsChartData} options={chartOptions} />
        </ChartCard>
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
            <strong>Sessions analyzed:</strong> {strengthHistory.length} strength training sessions
          </p>
          <p>
            <strong>1RM improvement:</strong> {oneRMData[0].toFixed(1)}kg → {oneRMData[oneRMData.length - 1].toFixed(1)}kg 
            ({oneRMData.length > 1 ? (((oneRMData[oneRMData.length - 1] - oneRMData[0]) / oneRMData[0]) * 100).toFixed(1) : '0'}% change)
          </p>
          <p>
            <strong>Max weight improvement:</strong> {maxWeightData[0].toFixed(1)}kg → {maxWeightData[maxWeightData.length - 1].toFixed(1)}kg 
            ({maxWeightData.length > 1 ? (((maxWeightData[maxWeightData.length - 1] - maxWeightData[0]) / maxWeightData[0]) * 100).toFixed(1) : '0'}% change)
          </p>
          <p>
            <strong>Average session volume:</strong> {(volumeData.reduce((sum, v) => sum + v, 0) / volumeData.length).toFixed(1)}kg
          </p>
        </div>
      </div>
    </div>
  );
}