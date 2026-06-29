import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import useChartTheme from '../hooks/useChartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ChartCard = ({ title, children, color }) => (
  <div className="chart-card">
    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color }}>
      {title}
    </h3>
    <div style={{ height: '250px', width: '100%' }}>
      {children}
    </div>
  </div>
);

export default function ProgrammeOverviewCharts({ data }) {
  const {
    gridColor, textColor, fontFamily,
    chartPrimary, chartPrimaryBg,
    chartSecondary, chartSecondaryBg,
    chartTertiary, chartTertiaryBg,
    chartCardDefault,
    tooltipBg, tooltipTitle, tooltipBody, tooltipBorder
  } = useChartTheme();

  if (!data || data.sessions.length === 0) {
    return (
      <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No sessions found for this programme.</p>
      </div>
    );
  }

  const { sessions, frequencyByMonth } = data;

  const sessionLabels = sessions.map(s => formatDate(s.date));

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily, size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: fontFamily, size: 10 } }
      }
    },
    elements: {
      point: { radius: 3, hoverRadius: 5 },
      line: { tension: 0.1 }
    }
  };

  const volumeChartData = {
    labels: sessionLabels,
    datasets: [{
      label: 'Volume (kg)',
      data: sessions.map(s => s.volume),
      borderColor: chartPrimary,
      backgroundColor: chartPrimaryBg,
      borderWidth: 2,
      fill: true
    }]
  };

  const setsChartData = {
    labels: sessionLabels,
    datasets: [{
      label: 'Working Sets',
      data: sessions.map(s => s.workingSets),
      borderColor: chartSecondary,
      backgroundColor: chartSecondaryBg,
      borderWidth: 2,
      fill: true
    }]
  };

  const freqLabels = frequencyByMonth.map(f => f.month);
  const freqChartData = {
    labels: freqLabels,
    datasets: [{
      label: 'Sessions',
      data: frequencyByMonth.map(f => f.count),
      backgroundColor: chartTertiaryBg,
      borderColor: chartTertiary,
      borderWidth: 2
    }]
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
      <ChartCard title="📊 Volume per Session (kg)" color={chartPrimary}>
        <Line data={volumeChartData} options={baseOptions} />
      </ChartCard>

      <ChartCard title="💪 Working Sets per Session" color={chartSecondary}>
        <Line data={setsChartData} options={baseOptions} />
      </ChartCard>

      <ChartCard title="📅 Workout Frequency (per month)" color={chartCardDefault}>
        <Bar data={freqChartData} options={baseOptions} />
      </ChartCard>
    </div>
  );
}
