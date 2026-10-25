import { Chart } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { DRINK_LABEL, DRINK_TYPES, SLOTS, type DaySummary } from '../time';
import { palette, useDark } from './charts';

/**
 * Drinks (stacked ml bars, left axis) vs pee count (line, right axis) per time slot.
 * `lastSlot` stops the pee line at the current slot so future slots don't read as zero.
 */
export default function DayChart({ s, lastSlot = SLOTS.length - 1 }: { s: DaySummary; lastSlot?: number }) {
  const dark = useDark();
  const c = palette(dark);
  const maxVoids = Math.max(3, ...s.slots.map((x) => x.voids));

  const data: ChartData<'bar' | 'line'> = {
    labels: SLOTS.map((x) => x.label),
    datasets: [
      {
        type: 'line',
        label: 'ฉี่ (ครั้ง)',
        data: s.slots.map((x, i) => (i <= lastSlot ? x.voids : null)),
        yAxisID: 'y1',
        borderColor: c.pee,
        backgroundColor: c.pee,
        pointBackgroundColor: c.surface,
        pointBorderWidth: 2.5,
        pointRadius: s.slots.map((x) => (x.voids ? 5 : 0)),
        pointHoverRadius: 6,
        borderWidth: 2.5,
        tension: 0.35,
        order: 0,
      },
      ...DRINK_TYPES.map((t) => ({
        type: 'bar' as const,
        label: DRINK_LABEL[t],
        data: s.slots.map((x) => x.ml[t]),
        yAxisID: 'y',
        backgroundColor: c[t],
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.62,
        stack: 'ml',
        order: 1,
      })),
    ],
  };

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (it) => `${SLOTS[it[0].dataIndex].label} ${SLOTS[it[0].dataIndex].range}`,
          label: (it) => `${it.dataset.label}: ${it.formattedValue}${it.dataset.yAxisID === 'y' ? ' ml' : ''}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: c.text, maxRotation: 0, autoSkip: false, font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        suggestedMax: 500,
        ticks: { color: c.text, maxTicksLimit: 5, font: { size: 10 } },
        grid: { color: c.grid },
        border: { display: false },
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        max: maxVoids + 1,
        ticks: { color: c.pee, precision: 0, stepSize: 1, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className="chart-box">
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
