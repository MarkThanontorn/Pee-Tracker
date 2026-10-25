import { useState } from 'react';
import { db } from '../db';
import { atOnDay, DRINK_LABEL, DRINK_TYPES, hhmm, type Drink, type DrinkType, type Void } from '../time';
import Sheet from './Sheet';

export type EditTarget =
  | { kind: 'drink'; record: Drink }
  | { kind: 'pee'; record: Void };

/** Create or edit one drink / pee record. A record without `id` is new. */
export default function RecordEditor({ target, day, onClose }: { target: EditTarget; day: string; onClose: () => void }) {
  const isNew = target.record.id === undefined;
  const [time, setTime] = useState(hhmm(target.record.at));
  const [type, setType] = useState<DrinkType>(target.kind === 'drink' ? target.record.type : 'water');
  const [ml, setMl] = useState(target.kind === 'drink' ? String(target.record.ml) : '');
  const [urgent, setUrgent] = useState(target.kind === 'pee' && !!target.record.urgent);
  const [pain, setPain] = useState(target.kind === 'pee' && !!target.record.pain);

  const at = atOnDay(day, time || '12:00');
  const mlNum = Number(ml);
  const valid = target.kind === 'pee' || (mlNum > 0 && mlNum <= 5000);

  async function save() {
    if (!valid) return;
    if (target.kind === 'drink') {
      const rec: Drink = { type, ml: mlNum, at };
      if (isNew) await db.drinks.add(rec);
      else await db.drinks.update(target.record.id!, rec);
    } else {
      const rec: Void = { at, urgent, pain };
      if (isNew) await db.voids.add(rec);
      else await db.voids.update(target.record.id!, rec);
    }
    onClose();
  }

  async function remove() {
    if (!confirm('ลบรายการนี้?')) return;
    if (target.kind === 'drink') await db.drinks.delete(target.record.id!);
    else await db.voids.delete(target.record.id!);
    onClose();
  }

  const title = `${isNew ? 'เพิ่ม' : 'แก้ไข'}${target.kind === 'drink' ? 'เครื่องดื่ม' : 'การฉี่'}`;
  return (
    <Sheet title={title} onClose={onClose}>
      <label className="field">
        เวลา
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      {target.kind === 'drink' ? (
        <>
          <div className="chips">
            {DRINK_TYPES.map((t) => (
              <button key={t} className={`chip${type === t ? ' on' : ''}`} onClick={() => setType(t)}>
                {DRINK_LABEL[t]}
              </button>
            ))}
          </div>
          <label className="field">
            ปริมาณ (ml)
            <input type="number" inputMode="numeric" min={1} max={5000} value={ml} onChange={(e) => setMl(e.target.value)} />
          </label>
        </>
      ) : (
        <>
          <label className="check">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> ปวดเร่งด่วน (กลั้นยาก)
          </label>
          <label className="check">
            <input type="checkbox" checked={pain} onChange={(e) => setPain(e.target.checked)} /> ปวดแสบขณะฉี่
          </label>
        </>
      )}
      <div className="btn-row">
        {!isNew && (
          <button className="btn danger" onClick={remove}>
            ลบ
          </button>
        )}
        <button className="btn" onClick={onClose}>
          ยกเลิก
        </button>
        <button className="btn primary" disabled={!valid} onClick={save}>
          บันทึก
        </button>
      </div>
    </Sheet>
  );
}
