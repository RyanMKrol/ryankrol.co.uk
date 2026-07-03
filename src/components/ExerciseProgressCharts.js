import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line, Bar } from 'react-chartjs-2';
import useChartTheme from '../hooks/useChartTheme';
import { toTimeSeries, timeScaleOptions } from '../lib/chartTime';

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Builds a top-to-bottom fade from the theme color to transparent, for area chart fills.
function gradientFill(hexColor) {
  return (context) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return 'transparent';

    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    return gradient;
  };
}

export default function ExerciseProgressCharts({ exerciseHistory, exerciseName }) {
  const {
    gridColor, textColor, fontFamily,
    chartCoral, chartIndigo, chartGrape, chartMarigold,
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
        borderColor: chartCoral,
        backgroundColor: gradientFill(chartCoral),
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
        borderColor: chartMarigold,
        backgroundColor: gradientFill(chartMarigold),
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
        backgroundColor: volumeData.map((_, index) =>
          index === volumeData.length - 1 ? chartGrape : chartIndigo
        ),
        borderRadius: 4
      }
    ]
  };

  const ChartCard = ({ title, children, color = chartCoral }) => (
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
        <ChartCard title="🎯 Estimated 1RM Progress" color={chartCoral}>
          <Line data={oneRMChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="📊 Session Volume" color={chartIndigo}>
          <Bar data={volumeChartData} options={chartOptions} />
        </ChartCard>

        <ChartCard title="💪 Max Weight Progress" color={chartMarigold}>
          <Line data={maxWeightChartData} options={chartOptions} />
        </ChartCard>
      </div>

      {/* Summary insights */}
      <div className="exercise-insights-panel">
        <h3 className="exercise-insights-panel-title">
          Progress Insights
        </h3>

        <div>
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
