import { useState } from 'react';
import { useRecords } from '../db';
import { dayRange, DRINK_LABEL, hhmm, SLOTS, slotIndex } from '../time';
import DayNav from '../components/DayNav';
import RecordEditor, { type EditTarget } from '../components/RecordEditor';
import { ChevronRight, DRINK_ICON, DropIcon, PlusIcon } from '../components/Icons';

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
      <div className="add-row">
        <button className="btn soft t-water" onClick={() => setEdit({ kind: 'drink', record: { type: 'water', ml: 250, at: newAt } })}>
          <PlusIcon size={18} /> เครื่องดื่ม
        </button>
        <button className="btn soft t-pee" onClick={() => setEdit({ kind: 'pee', record: { at: newAt } })}>
          <PlusIcon size={18} /> การฉี่
        </button>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>รายการ</h2>
          <span className="aside">{rows.length} รายการ</span>
        </div>
        {rows.length === 0 && <div className="empty">ยังไม่มีบันทึกในวันนี้</div>}
        {rows.map((r) => {
          const Icon = r.kind === 'pee' ? DropIcon : DRINK_ICON[r.record.type];
          const tone = r.kind === 'pee' ? 't-pee' : `t-${r.record.type}`;
          return (
            <button key={`${r.kind}-${r.record.id}`} className={`log ${tone}`} onClick={() => setEdit(r)}>
              <span className="time">{hhmm(r.record.at)}</span>
              <span className="ic">
                <Icon size={20} />
              </span>
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
                <small>ช่วง{SLOTS[slotIndex(r.record.at)].label}</small>
              </span>
              <ChevronRight size={18} className="chev" />
            </button>
          );
        })}
      </section>

      {edit && <RecordEditor key={`${edit.kind}-${edit.record.id}`} day={day} target={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
