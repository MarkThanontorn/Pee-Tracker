import { useEffect, useRef, useState } from 'react';
import { clearAll, exportBackup, exportCsv, importBackup, savePresets, seedDemo, usePresets, type Presets } from '../db';
import { DRINK_LABEL, DRINK_TYPES } from '../time';

/** Share sheet on mobile when available (easy to send to Files/LINE/email), download otherwise. */
async function saveFile(name: string, text: string, mime: string) {
  const file = new File([text], name, { type: mime });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export default function Settings() {
  const presets = usePresets();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(Object.fromEntries(DRINK_TYPES.map((t) => [t, presets[t].join(', ')])));
  }, [presets]);
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(false));
  }, []);

  async function savePresetDraft() {
    const next = {} as Presets;
    for (const t of DRINK_TYPES) {
      const nums = (draft[t] ?? '')
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => n > 0 && n <= 5000);
      if (nums.length === 0) return setMsg(`กรุณาใส่ขนาดของ${DRINK_LABEL[t]}อย่างน้อย 1 ค่า`);
      next[t] = nums.slice(0, 6);
    }
    await savePresets(next);
    setMsg('บันทึกขนาดแก้วแล้ว');
  }

  async function onImport(f: File | undefined) {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!confirm('นำเข้าจะ "แทนที่" ข้อมูลทั้งหมดในเครื่องนี้ ดำเนินการต่อ?')) return;
      await importBackup(data);
      setMsg(`นำเข้าแล้ว: ${data.drinks.length} เครื่องดื่ม, ${data.voids.length} การฉี่`);
    } catch (e) {
      setMsg(`นำเข้าไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <h1 style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', textShadow: '0 1px 2px #0004' }}>ตั้งค่า</h1>
      {msg && <div className="insight info">{msg}</div>}

      <div className="box">
        <h2>ขนาดแก้วที่ใช้บ่อย (ml)</h2>
        <p className="muted">คั่นด้วยจุลภาค สูงสุด 6 ค่า — แสดงเป็นปุ่มเมื่อแตะการ์ด</p>
        {DRINK_TYPES.map((t) => (
          <label key={t} className="field">
            <span style={{ width: 90, flex: 'none' }}>{DRINK_LABEL[t]}</span>
            <input type="text" inputMode="numeric" value={draft[t] ?? ''} onChange={(e) => setDraft({ ...draft, [t]: e.target.value })} />
          </label>
        ))}
        <button className="btn primary" style={{ width: '100%' }} onClick={savePresetDraft}>
          บันทึกขนาดแก้ว
        </button>
      </div>

      <div className="box">
        <h2>สำรอง / ส่งออกข้อมูล</h2>
        <p className="muted">ข้อมูลเก็บอยู่ในเครื่องนี้เท่านั้น แนะนำให้ส่งออกเก็บไว้เป็นระยะ</p>
        <div className="btn-row">
          <button className="btn" onClick={async () => saveFile(`pee-tracker-${stamp()}.json`, JSON.stringify(await exportBackup()), 'application/json')}>
            สำรอง (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            นำเข้า
          </button>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={async () => saveFile(`pee-tracker-${stamp()}.csv`, await exportCsv(), 'text/csv')}>
            ส่งออก CSV (ให้แพทย์ดู)
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        <p className="muted" style={{ marginTop: 12 }}>
          สถานะพื้นที่เก็บ: {persisted === null ? '…' : persisted ? 'ถาวร ✓' : 'ชั่วคราว — ติดตั้งลงหน้าจอโฮมเพื่อลดโอกาสข้อมูลหาย'}
        </p>
      </div>

      <div className="box">
        <h2>ข้อมูล</h2>
        {import.meta.env.DEV && (
          <div className="btn-row">
            <button className="btn" onClick={async () => { await seedDemo(); setMsg('เพิ่มข้อมูลตัวอย่าง 90 วันแล้ว'); }}>
              เพิ่มข้อมูลตัวอย่าง (dev)
            </button>
          </div>
        )}
        <div className="btn-row">
          <button
            className="btn danger"
            onClick={async () => {
              if (!confirm('ลบข้อมูลการดื่มและการฉี่ทั้งหมด? (กู้คืนไม่ได้ถ้าไม่ได้สำรองไว้)')) return;
              await clearAll();
              setMsg('ลบข้อมูลทั้งหมดแล้ว');
            }}
          >
            ลบข้อมูลทั้งหมด
          </button>
        </div>
        <p className="muted">
          แอพนี้ใช้เกณฑ์ทั่วไปเพื่อช่วยสังเกตพฤติกรรม ไม่ใช่เครื่องมือวินิจฉัยโรค หากมีอาการผิดปกติควรปรึกษาแพทย์
        </p>
      </div>
    </>
  );
}
