import { useCallback, useEffect, useState } from 'react';
import { db, requestPersistence, usePresets, useRecords } from '../db';
import { dayRange, DRINK_LABEL, DRINK_TYPES, hhmm, slotIndex, summarize, type DrinkType } from '../time';
import DayNav from '../components/DayNav';
import PresetSheet from '../components/PresetSheet';
import RecordEditor from '../components/RecordEditor';
import DayChart from '../components/SlotChart';
import Toast, { type ToastData } from '../components/Toast';
import { ClockIcon, DRINK_ICON, DropIcon, MoonIcon, PlusIcon, SunIcon } from '../components/Icons';

interface Props {
  day: string;
  today: string;
  setDay: (k: string) => void;
}

const FLUID_GOAL = 2000;
const buzz = () => navigator.vibrate?.(30);

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function ago(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60_000));
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  return `${h} ชม. ${min % 60} น.`;
}

export default function Today({ day, today, setDay }: Props) {
  const isToday = day === today;
  const [start, end] = dayRange(day);
  const rec = useRecords(start, end);
  const presets = usePresets();
  const now = useNow(30_000);
  const s = summarize(day, rec?.drinks ?? [], rec?.voids ?? []);

  const [sheet, setSheet] = useState<DrinkType | null>(null);
  const [backdatePee, setBackdatePee] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [ripple, setRipple] = useState(0);
  const closeToast = useCallback(() => setToast(null), []);

  function peeToast(id: number, at: number, urgent = false, pain = false) {
    const update = (u: boolean, p: boolean) => {
      db.voids.update(id, { urgent: u, pain: p });
      peeToast(id, at, u, p);
    };
    setToast({
      id,
      icon: <DropIcon size={18} />,
      message: `บันทึกการฉี่ ${hhmm(at)}`,
      actions: [
        { label: 'ปวดเร่งด่วน', on: urgent, onClick: () => update(!urgent, pain) },
        { label: 'ปวดแสบ', on: pain, onClick: () => update(urgent, !pain) },
        { label: 'ยกเลิก', undo: true, onClick: () => { db.voids.delete(id); setToast(null); } },
      ],
    });
  }

  async function logPee() {
    if (!isToday) return setBackdatePee(true);
    const at = Date.now();
    buzz();
    setRipple((r) => r + 1);
    const id = await db.voids.add({ at });
    peeToast(id, at);
    requestPersistence();
  }

  async function logDrink(type: DrinkType, ml: number, at: number) {
    setSheet(null);
    buzz();
    const id = await db.drinks.add({ type, ml, at });
    const Icon = DRINK_ICON[type];
    setToast({
      id,
      icon: <Icon size={18} />,
      message: `${DRINK_LABEL[type]} +${ml} ml · ${hhmm(at)}`,
      actions: [{ label: 'ยกเลิก', undo: true, onClick: () => { db.drinks.delete(id); setToast(null); } }],
    });
    requestPersistence();
  }

  const scale = Math.max(FLUID_GOAL, s.totalMl);
  const pct = Math.round((s.totalMl / FLUID_GOAL) * 100);

  return (
    <>
      <DayNav day={day} today={today} setDay={setDay} />

      <section className="card hero">
        <div className="orb-wrap">
          <button className="orb" onClick={logPee} aria-label="บันทึกการฉี่">
            <DropIcon size={30} />
            <span className="count">{s.voids}</span>
            <span className="label">ครั้ง</span>
            <span className="tap">{isToday ? 'แตะเพื่อบันทึก' : 'แตะเพื่อเพิ่มย้อนหลัง'}</span>
          </button>
          {ripple > 0 && <span key={ripple} className="ripple" />}
        </div>
        <div className="hero-stats">
          <div>
            <b>{s.lastVoidAt ? hhmm(s.lastVoidAt) : '—'}</b>
            <span>
              <ClockIcon size={13} />
              {isToday && s.lastVoidAt ? `${ago(now - s.lastVoidAt)}ที่แล้ว` : 'ครั้งล่าสุด'}
            </span>
          </div>
          <div>
            <b>{s.dayVoids}</b>
            <span>
              <SunIcon size={13} />
              กลางวัน
            </span>
          </div>
          <div>
            <b>{s.nightVoids}</b>
            <span>
              <MoonIcon size={13} />
              กลางคืน
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>เครื่องดื่ม</h2>
          <span className="aside">
            <b style={{ color: 'var(--text)' }}>{s.totalMl.toLocaleString()}</b> / {FLUID_GOAL.toLocaleString()} ml
          </span>
        </div>
        <div className="intake" role="img" aria-label={`ดื่มรวม ${pct}% ของเป้า`}>
          {DRINK_TYPES.map((t) => (
            <i key={t} style={{ width: `${(s.ml[t] / scale) * 100}%`, background: `var(--${t})` }} />
          ))}
        </div>
        <div className="intake-legend">
          <span>{pct}% ของเป้าหมาย</span>
          <span>{s.totalMl >= FLUID_GOAL ? 'ถึงเป้าแล้ว' : `อีก ${(FLUID_GOAL - s.totalMl).toLocaleString()} ml`}</span>
        </div>
        <div className="drinks">
          {DRINK_TYPES.map((t) => {
            const Icon = DRINK_ICON[t];
            return (
              <button key={t} className={`drink t-${t}`} onClick={() => setSheet(t)}>
                <span className="plus">
                  <PlusIcon size={13} strokeWidth={2.6} />
                </span>
                <span className="ic">
                  <Icon />
                </span>
                <span className="name">{DRINK_LABEL[t]}</span>
                <span className="ml">{s.ml[t].toLocaleString()}</span>
                <span className="cnt">ml · {s.drinkCount[t]} ครั้ง</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>ดื่ม vs ฉี่ ตามช่วงเวลา</h2>
        </div>
        <DayChart s={s} lastSlot={isToday ? slotIndex(now) : undefined} />
        <div className="legend">
          {DRINK_TYPES.map((t) => (
            <span key={t} className={`t-${t}`}>
              <i />
              {DRINK_LABEL[t]} (ml)
            </span>
          ))}
          <span className="t-pee">
            <i className="dot" />
            ฉี่ (ครั้ง)
          </span>
        </div>
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
        <RecordEditor day={day} target={{ kind: 'pee', record: { at: start + 6 * 3600_000 } }} onClose={() => setBackdatePee(false)} />
      )}
      {toast && <Toast toast={toast} onDone={closeToast} />}
    </>
  );
}
