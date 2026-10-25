import { useState } from 'react';
import { atOnDay, DRINK_LABEL, hhmm, type DrinkType } from '../time';
import { DRINK_ICON } from './Icons';
import Sheet from './Sheet';

interface Props {
  type: DrinkType;
  presets: number[];
  day: string;
  isToday: boolean;
  onSave: (ml: number, at: number) => void;
  onClose: () => void;
}

/** One tap on a preset logs the drink; time defaults to now (or 12:00 on a past day). */
export default function PresetSheet({ type, presets, day, isToday, onSave, onClose }: Props) {
  const [time, setTime] = useState(isToday ? hhmm(Date.now()) : '12:00');
  const [custom, setCustom] = useState('');
  const at = () => (isToday && time === hhmm(Date.now()) ? Date.now() : atOnDay(day, time));
  const customMl = Number(custom);
  const Icon = DRINK_ICON[type];

  return (
    <Sheet title={`เพิ่ม${DRINK_LABEL[type]}`} icon={<Icon />} tone={`t-${type}`} onClose={onClose}>
      <div className="presets">
        {presets.map((ml) => (
          <button key={ml} className="btn soft" onClick={() => onSave(ml, at())}>
            {ml}
            <small>ml</small>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <label className="field">
          กำหนดเอง (ml)
          <input type="number" inputMode="numeric" placeholder="เช่น 400" value={custom} onChange={(e) => setCustom(e.target.value)} />
        </label>
        <label className="field">
          เวลา
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="btn-row">
        <button className="btn" onClick={onClose}>
          ปิด
        </button>
        <button className="btn accent" disabled={!(customMl > 0 && customMl <= 5000)} onClick={() => onSave(customMl, at())}>
          บันทึก{customMl > 0 ? ` ${customMl} ml` : ''}
        </button>
      </div>
    </Sheet>
  );
}
