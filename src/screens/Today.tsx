import { useCallback, useState } from 'react';
import { db, requestPersistence, usePresets, useRecords } from '../db';
import { dayRange, DRINK_EN, DRINK_LABEL, DRINK_TYPES, hhmm, summarize, type DrinkType } from '../time';
import DayNav from '../components/DayNav';
import PresetSheet from '../components/PresetSheet';
import RecordEditor from '../components/RecordEditor';
import { DrinkSlotChart, PeeSlotChart } from '../components/SlotChart';
import Toast, { type ToastData } from '../components/Toast';

interface Props {
  day: string;
  today: string;
  setDay: (k: string) => void;
}

const buzz = () => navigator.vibrate?.(30);

export default function Today({ day, today, setDay }: Props) {
  const isToday = day === today;
  const [start, end] = dayRange(day);
  const rec = useRecords(start, end);
  const presets = usePresets();
  const s = summarize(day, rec?.drinks ?? [], rec?.voids ?? []);

  const [sheet, setSheet] = useState<DrinkType | null>(null);
  const [backdatePee, setBackdatePee] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  function peeToast(id: number, at: number, urgent = false, pain = false) {
    const update = (u: boolean, p: boolean) => {
      db.voids.update(id, { urgent: u, pain: p });
      peeToast(id, at, u, p);
    };
    setToast({
      id,
      message: `บันทึกการฉี่ ${hhmm(at)} แล้ว`,
      actions: [
        { label: 'เร่งด่วน', on: urgent, warn: true, onClick: () => update(!urgent, pain) },
        { label: 'ปวดแสบ', on: pain, warn: true, onClick: () => update(urgent, !pain) },
        { label: 'ยกเลิก', onClick: () => { db.voids.delete(id); setToast(null); } },
      ],
    });
  }

  async function logPee() {
    if (!isToday) return setBackdatePee(true);
    const at = Date.now();
    buzz();
    const id = await db.voids.add({ at });
    peeToast(id, at);
    requestPersistence();
  }

  async function logDrink(type: DrinkType, ml: number, at: number) {
    setSheet(null);
    buzz();
    const id = await db.drinks.add({ type, ml, at });
    setToast({
      id,
      message: `+${ml} ml ${DRINK_LABEL[type]} (${hhmm(at)})`,
      actions: [{ label: 'ยกเลิก', onClick: () => { db.drinks.delete(id); setToast(null); } }],
    });
    requestPersistence();
  }

  return (
    <>
      <DayNav day={day} today={today} setDay={setDay} />

      <div className="today-grid">
        {DRINK_TYPES.map((t, i) => (
          <button key={t} className="card drink-card" style={{ gridColumn: 1, gridRow: i + 1 }} onClick={() => setSheet(t)}>
            <span className="name">{DRINK_EN[t]}</span>
            <span className="value">{s.ml[t].toLocaleString()} ml</span>
            <span className="sub">{s.drinkCount[t]} ครั้ง</span>
          </button>
        ))}
        <button className="card pee-btn" onClick={logPee}>
          <span className="drop">💧</span>
          <span className="name">Pee</span>
          <span className="count">{s.voids}</span>
          <span className="sub">ครั้ง{s.nightVoids ? ` (กลางคืน ${s.nightVoids})` : ''}</span>
          <span className="sub">{s.lastVoidAt ? `ล่าสุด ${hhmm(s.lastVoidAt)}` : 'ยังไม่มีบันทึก'}</span>
          <span className="hint">{isToday ? 'แตะ 1 ครั้ง = บันทึกทันที' : 'แตะเพื่อเพิ่มย้อนหลัง'}</span>
        </button>
      </div>

      <section className="panel blue">
        <h3>
          การฉี่ตามช่วงเวลา <span>{s.voids} ครั้ง</span>
        </h3>
        <PeeSlotChart s={s} />
      </section>
      <section className="panel green">
        <h3>
          การดื่มตามช่วงเวลา (ml) <span>รวม {s.totalMl.toLocaleString()} ml</span>
        </h3>
        <DrinkSlotChart s={s} />
      </section>

      {sheet && (
        <PresetSheet
          type={sheet}
          presets={presets[sheet]}
          day={day}
          isToday={isToday}
          onSave={(ml, at) => logDrink(sheet, ml, at)}
          onClose={() => setSheet(null)}
        />
      )}
      {backdatePee && (
        <RecordEditor
          day={day}
          target={{ kind: 'pee', record: { at: start + 6 * 3600_000 } }}
          onClose={() => setBackdatePee(false)}
        />
      )}
      {toast && <Toast toast={toast} onDone={closeToast} />}
    </>
  );
}
