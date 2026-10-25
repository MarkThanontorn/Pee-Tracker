import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { DRINK_LABEL, DRINK_TYPES, SLOTS, type DaySummary } from '../time';
import { DRINK_ON_GREEN } from './charts';

const labels = SLOTS.map((s) => s.label);

function options(stacked: boolean, integer: boolean): ChartOptions<'bar'> {
  const tick = { color: '#ffffffd9', font: { size: 11 } };
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: stacked, position: 'bottom', labels: { color: '#fff', boxWidth: 10, font: { size: 11 } } },
      tooltip: { callbacks: { title: (it) => `${SLOTS[it[0].dataIndex].label} ${SLOTS[it[0].dataIndex].range}` } },
    },
    scales: {
      x: {
        stacked,
        ticks: { ...tick, maxRotation: 0, autoSkip: false, font: { size: 10 } },
        grid: { display: false },
        border: { color: '#ffffff55' },
      },
      y: {
        stacked,
        beginAtZero: true,
        suggestedMax: integer ? 3 : 500,
        ticks: { ...tick, precision: 0, maxTicksLimit: 5 },
        grid: { color: '#ffffff22' },
        border: { display: false },
      },
    },
  };
}

export function PeeSlotChart({ s }: { s: DaySummary }) {
  return (
    <div className="chart-box">
      <Bar
        options={options(false, true)}
        data={{
          labels,
          datasets: [{ label: 'ครั้ง', data: s.slots.map((x) => x.voids), backgroundColor: '#ffffffdd', borderRadius: 4 }],
        }}
      />
    </div>
  );
}

export function DrinkSlotChart({ s }: { s: DaySummary }) {
  return (
    <div className="chart-box">
      <Bar
        options={options(true, false)}
        data={{
          labels,
          datasets: DRINK_TYPES.map((t) => ({
            label: DRINK_LABEL[t],
            data: s.slots.map((x) => x.ml[t]),
            backgroundColor: DRINK_ON_GREEN[t],
            borderRadius: 3,
          })),
        }}
      />
    </div>
  );
}
