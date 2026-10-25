import { addDays, formatDay } from '../time';

interface Props {
  day: string;
  today: string;
  setDay: (k: string) => void;
}

export default function DayNav({ day, today, setDay }: Props) {
  const isToday = day === today;
  return (
    <div className="daynav">
      <button aria-label="วันก่อนหน้า" onClick={() => setDay(addDays(day, -1))}>‹</button>
      <button className="title" onClick={() => setDay(today)}>
        {isToday ? 'วันนี้' : formatDay(day)}
        <small>{isToday ? formatDay(day) : 'แตะเพื่อกลับวันนี้'} · 06:00–06:00</small>
      </button>
      <button aria-label="วันถัดไป" disabled={isToday} onClick={() => setDay(addDays(day, 1))}>›</button>
    </div>
  );
}
