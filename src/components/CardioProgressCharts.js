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
import useChartTheme from '../hooks/useChartTheme';

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
  const {
    gridColor, textColor, fontFamily,
    chartPrimary, chartPrimaryBg,
    chartSecondary, chartSecondaryBg,
    chartTertiary, chartTertiaryBg,
    chartCardDefault,
    tooltipBg, tooltipTitle, tooltipBody, tooltipBorder
  } = useChartTheme();

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
      <div className="text-muted" style={{
        textAlign: 'center',
        padding: '2rem'
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
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: {
            family: fontFamily,
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor,
          font: {
            family: fontFamily,
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
        borderColor: chartPrimary,
        backgroundColor: chartPrimaryBg,
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
        borderColor: chartSecondary,
        backgroundColor: chartSecondaryBg,
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
        borderColor: chartTertiary,
        backgroundColor: chartTertiaryBg,
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const ChartCard = ({ title, children, color = chartCardDefault }) => (
    <div className="chart-card">
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
        <ChartCard title="📏 Distance Progress" color={chartPrimary}>
          <Line data={distanceChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="⏱️ Duration Progress" color={chartSecondary}>
          <Line data={durationChartData} options={chartOptions} />
        </ChartCard>

        {hasPaceData && (
          <ChartCard title="🏃 Pace Progress" color={chartTertiary}>
            <Line data={paceChartData} options={chartOptions} />
          </ChartCard>
        )}
      </div>

      {/* Summary insights */}
      <div className="insights-panel" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          📋 Progress Insights
        </h3>

        <div className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
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
