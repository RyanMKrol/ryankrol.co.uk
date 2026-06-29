import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import useChartTheme from '../hooks/useChartTheme';
import { toTimeSeries, timeScaleOptions } from '../lib/chartTime';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ExerciseProgressCharts({ exerciseHistory, exerciseName }) {
  const {
    gridColor, textColor, fontFamily,
    chartPrimary, chartPrimaryBg,
    chartSecondary, chartSecondaryBg,
    chartTertiary, chartTertiaryBg,
    chartCardDefault,
    tooltipBg, tooltipTitle, tooltipBody, tooltipBorder
  } = useChartTheme();

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
      <div className="text-muted" style={{
        textAlign: 'center',
        padding: '2rem'
      }}>
        <p>Need at least 2 strength training sessions to show progress charts.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Current sessions: {strengthHistory.length}
        </p>
      </div>
    );
  }

  const oneRMData = toTimeSeries(strengthHistory, h => h.workout_date, h => h.bestEstimated1RM);
  const maxWeightData = toTimeSeries(strengthHistory, h => h.workout_date, h => h.heaviestWeight);
  const volumeData = toTimeSeries(strengthHistory, h => h.workout_date, h => h.sessionVolume);

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
        ...timeScaleOptions,
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

  const oneRMChartData = {
    datasets: [
      {
        label: 'Estimated 1RM (kg)',
        data: oneRMData,
        borderColor: chartPrimary,
        backgroundColor: chartPrimaryBg,
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const maxWeightChartData = {
    datasets: [
      {
        label: 'Max Weight (kg)',
        data: maxWeightData,
        borderColor: chartSecondary,
        backgroundColor: chartSecondaryBg,
        borderWidth: 2,
        fill: true
      }
    ]
  };

  const volumeChartData = {
    datasets: [
      {
        label: 'Session Volume (kg)',
        data: volumeData,
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
        <ChartCard title="📊 Session Volume" color={chartTertiary}>
          <Line data={volumeChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="🎯 Estimated 1RM Progress" color={chartPrimary}>
          <Line data={oneRMChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="💪 Max Weight Progress" color={chartSecondary}>
          <Line data={maxWeightChartData} options={chartOptions} />
        </ChartCard>
      </div>

      {/* Summary insights */}
      <div className="insights-panel" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          📋 Progress Insights
        </h3>

        <div className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
          <p>
            <strong>Sessions analyzed:</strong> {strengthHistory.length} strength training sessions
          </p>
          <p>
            <strong>1RM improvement:</strong> {oneRMData[0].y.toFixed(1)}kg → {oneRMData[oneRMData.length - 1].y.toFixed(1)}kg
            ({oneRMData.length > 1 ? (((oneRMData[oneRMData.length - 1].y - oneRMData[0].y) / oneRMData[0].y) * 100).toFixed(1) : '0'}% change)
          </p>
          <p>
            <strong>Max weight improvement:</strong> {maxWeightData[0].y.toFixed(1)}kg → {maxWeightData[maxWeightData.length - 1].y.toFixed(1)}kg
            ({maxWeightData.length > 1 ? (((maxWeightData[maxWeightData.length - 1].y - maxWeightData[0].y) / maxWeightData[0].y) * 100).toFixed(1) : '0'}% change)
          </p>
          <p>
            <strong>Average session volume:</strong> {(volumeData.reduce((sum, v) => sum + v.y, 0) / volumeData.length).toFixed(1)}kg
          </p>
        </div>
      </div>
    </div>
  );
}
