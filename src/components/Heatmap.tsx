import { SLOTS, type DaySummary } from '../time';

const short = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${d}/${m}`;
};

/** Pee count per slot (rows) × day (columns). */
export default function Heatmap({ days, dark }: { days: DaySummary[]; dark: boolean }) {
  const max = Math.max(1, ...days.flatMap((d) => d.slots.map((s) => s.voids)));
  const rgb = dark ? '95,181,234' : '26,95,128';
  return (
    <div className="heatmap">
      {SLOTS.map((slot, i) => (
        <div key={slot.label} style={{ display: 'contents' }}>
          <span className="muted">{slot.label}</span>
          <div className="row" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map((d) => {
              const n = d.slots[i].voids;
              return (
                <div
                  key={d.key}
                  className="cell"
                  title={`${short(d.key)} ${slot.label}: ${n} ครั้ง`}
                  style={n ? { background: `rgba(${rgb},${0.25 + 0.75 * (n / max)})` } : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
      <span />
      <div className="axis">
        <span>{short(days[0].key)}</span>
        <span>{short(days[days.length - 1].key)}</span>
      </div>
    </div>
  );
}
