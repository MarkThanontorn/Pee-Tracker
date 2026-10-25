import { useState } from 'react';
import { db } from '../db';
import { atOnDay, DRINK_LABEL, DRINK_TYPES, hhmm, type Drink, type DrinkType, type Void } from '../time';
import { DRINK_ICON, DropIcon } from './Icons';
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

  const isDrink = target.kind === 'drink';
  const Icon = isDrink ? DRINK_ICON[type] : DropIcon;
  const title = `${isNew ? 'เพิ่ม' : 'แก้ไข'}${isDrink ? 'เครื่องดื่ม' : 'การฉี่'}`;
  return (
    <Sheet title={title} icon={<Icon />} tone={isDrink ? `t-${type}` : 't-pee'} onClose={onClose}>
      {isDrink ? (
        <>
          <div className="chips">
            {DRINK_TYPES.map((t) => {
              const TIcon = DRINK_ICON[t];
              return (
                <button key={t} className={`chip t-${t}${type === t ? ' on' : ''}`} onClick={() => setType(t)}>
                  <TIcon size={16} />
                  {DRINK_LABEL[t]}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8 }}>
            <label className="field">
              ปริมาณ (ml)
              <input type="number" inputMode="numeric" min={1} max={5000} value={ml} onChange={(e) => setMl(e.target.value)} />
            </label>
            <label className="field">
              เวลา
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
        </>
      ) : (
        <>
          <label className="field">
            เวลา
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <div className="muted" style={{ marginTop: 6 }}>อาการ (ถ้ามี)</div>
          <div className="toggle-row">
            <button className={`toggle${urgent ? ' on' : ''}`} onClick={() => setUrgent(!urgent)}>
              ปวดเร่งด่วน
            </button>
            <button className={`toggle${pain ? ' on' : ''}`} onClick={() => setPain(!pain)}>
              ปวดแสบ
            </button>
          </div>
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
        <button className="btn accent" disabled={!valid} onClick={save}>
          บันทึก
        </button>
      </div>
    </Sheet>
  );
}
