import {
  Chart as ChartJS,
  CategoryScale,
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
  CategoryScale,
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

  const yAxisOptions = {
    grid: { color: gridColor },
    ticks: { color: textColor, font: { family: fontFamily, size: 10 } }
  };

  const timeXOptions = {
    ...timeScaleOptions,
    grid: { color: gridColor },
    ticks: { color: textColor, font: { family: fontFamily, size: 10 } }
  };

  const categoryXOptions = {
    grid: { color: gridColor },
    ticks: { color: textColor, font: { family: fontFamily, size: 10 } }
  };

  const tooltipPlugin = {
    mode: 'index',
    intersect: false,
    backgroundColor: tooltipBg,
    titleColor: tooltipTitle,
    bodyColor: tooltipBody,
    borderColor: tooltipBorder,
    borderWidth: 1
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipPlugin },
    scales: { x: timeXOptions, y: yAxisOptions },
    elements: { point: { radius: 3, hoverRadius: 5 }, line: { tension: 0.1 } }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipPlugin },
    scales: { x: categoryXOptions, y: yAxisOptions },
    elements: { point: { radius: 3, hoverRadius: 5 }, line: { tension: 0.1 } }
  };

  const volumeChartData = {
    datasets: [{
      label: 'Volume (kg)',
      data: toTimeSeries(sessions, s => s.date, s => s.volume),
      borderColor: chartPrimary,
      backgroundColor: chartPrimaryBg,
      borderWidth: 2,
      fill: true
    }]
  };

  const setsChartData = {
    datasets: [{
      label: 'Working Sets',
      data: toTimeSeries(sessions, s => s.date, s => s.workingSets),
      borderColor: chartSecondary,
      backgroundColor: chartSecondaryBg,
      borderWidth: 2,
      fill: true
    }]
  };

  const freqChartData = {
    labels: frequencyByMonth.map(f => f.month),
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
        <Line data={volumeChartData} options={lineOptions} />
      </ChartCard>

      <ChartCard title="💪 Working Sets per Session" color={chartSecondary}>
        <Line data={setsChartData} options={lineOptions} />
      </ChartCard>

      <ChartCard title="📅 Workout Frequency (per month)" color={chartCardDefault}>
        <Bar data={freqChartData} options={barOptions} />
      </ChartCard>
    </div>
  );
}
