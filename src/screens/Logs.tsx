import { useState } from 'react';
import { useRecords } from '../db';
import { dayRange, DRINK_LABEL, hhmm } from '../time';
import DayNav from '../components/DayNav';
import RecordEditor, { type EditTarget } from '../components/RecordEditor';

interface Props {
  day: string;
  today: string;
  setDay: (k: string) => void;
}

export default function Logs({ day, today, setDay }: Props) {
  const [start, end] = dayRange(day);
  const rec = useRecords(start, end);
  const [edit, setEdit] = useState<EditTarget | null>(null);

  const rows: EditTarget[] = [
    ...(rec?.drinks ?? []).map((record) => ({ kind: 'drink' as const, record })),
    ...(rec?.voids ?? []).map((record) => ({ kind: 'pee' as const, record })),
  ].sort((a, b) => a.record.at - b.record.at);

  const newAt = day === today ? Date.now() : start + 6 * 3600_000;

  return (
    <>
      <DayNav day={day} today={today} setDay={setDay} />
      <div className="btn-row" style={{ marginTop: 0 }}>
        <button className="btn green" onClick={() => setEdit({ kind: 'drink', record: { type: 'water', ml: 250, at: newAt } })}>
          + เครื่องดื่ม
        </button>
        <button className="btn primary" onClick={() => setEdit({ kind: 'pee', record: { at: newAt } })}>
          + ฉี่
        </button>
      </div>

      <div className="box">
        <h2>รายการ ({rows.length})</h2>
        {rows.length === 0 && <p className="muted">ยังไม่มีบันทึกในวันนี้</p>}
        {rows.map((r) => (
          <button key={`${r.kind}-${r.record.id}`} className="log" onClick={() => setEdit(r)}>
            <span className="time">{hhmm(r.record.at)}</span>
            <span className={`icon ${r.kind}`}>{r.kind === 'pee' ? '💧' : r.record.type === 'coffee' ? '☕' : r.record.type === 'alcohol' ? '🍺' : '🥤'}</span>
            <span className="what">
              {r.kind === 'drink' ? (
                <>
                  {DRINK_LABEL[r.record.type]} <b>{r.record.ml} ml</b>
                </>
              ) : (
                <>
                  ฉี่
                  {r.record.urgent && <span className="tag">เร่งด่วน</span>}
                  {r.record.pain && <span className="tag">ปวดแสบ</span>}
                </>
              )}
            </span>
            <span className="muted">แก้ไข ›</span>
          </button>
        ))}
      </div>

      {edit && <RecordEditor key={`${edit.kind}-${edit.record.id}`} day={day} target={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
