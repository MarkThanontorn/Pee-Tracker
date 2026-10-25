import { addDays, formatDay } from '../time';
import { ChevronLeft, ChevronRight } from './Icons';

interface Props {
  day: string;
  today: string;
  setDay: (k: string) => void;
}

/** Screen header: date title with prev / today / next controls. */
export default function DayNav({ day, today, setDay }: Props) {
  const isToday = day === today;
  const yesterday = day === addDays(today, -1);
  return (
    <header className="top">
      <div>
        <div className="eyebrow">{isToday ? 'วันนี้' : yesterday ? 'เมื่อวาน' : 'ย้อนหลัง'} · 06:00–06:00</div>
        <h1>{formatDay(day)}</h1>
      </div>
      <div className="daynav">
        {!isToday && (
          <button className="icon-btn today-chip" onClick={() => setDay(today)}>
            วันนี้
          </button>
        )}
        <button className="icon-btn" aria-label="วันก่อนหน้า" onClick={() => setDay(addDays(day, -1))}>
          <ChevronLeft size={20} />
        </button>
        <button className="icon-btn" aria-label="วันถัดไป" disabled={isToday} onClick={() => setDay(addDays(day, 1))}>
          <ChevronRight size={20} />
        </button>
      </div>
    </header>
  );
}
