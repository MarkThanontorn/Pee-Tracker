import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { useRecords } from '../db';
import { computeInsights } from '../insights';
import { addDays, dayRange, DRINK_LABEL, DRINK_TYPES, summarizeRange, type DaySummary } from '../time';
import { drinkColors, peeColors, useDark } from '../components/charts';
import Heatmap from '../components/Heatmap';

const RANGES = [7, 30, 90] as const;

const short = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${d}/${m}`;
};

function opts(dark: boolean, integer: boolean): ChartOptions<'bar'> {
  const color = dark ? '#9db0c2' : '#5a6b7b';
  const grid = dark ? '#34475a' : '#dde5ec';
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: { legend: { position: 'bottom', labels: { color, boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { stacked: true, ticks: { color, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 11 } }, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, ticks: { color, precision: integer ? 0 : undefined, maxTicksLimit: 6 }, grid: { color: grid }, border: { display: false } },
    },
  };
}

function avg(days: DaySummary[], f: (d: DaySummary) => number) {
  const logged = days.filter((d) => d.hasData);
  return logged.length ? logged.reduce((a, d) => a + f(d), 0) / logged.length : 0;
}

export default function Trends({ today }: { today: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const dark = useDark();
  const first = addDays(today, -(range - 1));
  const rec = useRecords(dayRange(first)[0], dayRange(today)[1]);
  const days = summarizeRange(today, range, rec?.drinks ?? [], rec?.voids ?? []);
  const insights = computeInsights(days);
  const labels = days.map((d) => short(d.key));
  const pc = peeColors(dark);
  const dc = drinkColors(dark);
  const logged = days.filter((d) => d.hasData).length;
  const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : (Math.round(n * 10) / 10).toString());

  return (
    <>
      <div className="segment">
        {RANGES.map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
            {r === 90 ? '3 เดือน' : `${r} วัน`}
          </button>
        ))}
      </div>

      <div className="box">
        <h2>สรุปเฉลี่ยต่อวัน</h2>
        <div className="stats">
          <div className="stat"><b>{fmt(avg(days, (d) => d.voids))}</b><span>ฉี่ (ครั้ง)</span></div>
          <div className="stat"><b>{fmt(avg(days, (d) => d.nightVoids))}</b><span>ฉี่กลางคืน</span></div>
          <div className="stat"><b>{fmt(avg(days, (d) => d.totalMl))}</b><span>ดื่มรวม (ml)</span></div>
          <div className="stat"><b>{fmt(avg(days, (d) => d.ml.water))}</b><span>น้ำ (ml)</span></div>
          <div className="stat"><b>{fmt(avg(days, (d) => d.ml.coffee))}</b><span>กาแฟ (ml)</span></div>
          <div className="stat"><b>{fmt(avg(days, (d) => d.ml.alcohol))}</b><span>แอลกอฮอล์ (ml)</span></div>
        </div>
        <p className="muted">คิดจาก {logged} วันที่มีบันทึก (จาก {range} วัน)</p>
      </div>

      <div className="box">
        <h2>ข้อสังเกต</h2>
        {insights.map((i) => (
          <div key={i.text} className={`insight ${i.level}`}>
            {i.level === 'warn' ? '⚠️ ' : i.level === 'good' ? '✅ ' : 'ℹ️ '}
            {i.text}
          </div>
        ))}
        <p className="muted" style={{ marginTop: 10 }}>
          อ้างอิงเกณฑ์ทั่วไป ไม่ใช่การวินิจฉัย — หากมีอาการต่อเนื่องควรปรึกษาแพทย์ (ส่งออก CSV ได้ในหน้าตั้งค่า)
        </p>
      </div>

      <div className="box">
        <h2>การฉี่ต่อวัน</h2>
        <div className="chart-box" style={{ height: 200 }}>
          <Bar
            options={opts(dark, true)}
            data={{
              labels,
              datasets: [
                { label: 'กลางวัน 06–24', data: days.map((d) => d.dayVoids), backgroundColor: pc.day, borderRadius: 2 },
                { label: 'กลางคืน 00–06', data: days.map((d) => d.nightVoids), backgroundColor: pc.night, borderRadius: 2 },
              ],
            }}
          />
        </div>
      </div>

      <div className="box">
        <h2>การดื่มต่อวัน (ml)</h2>
        <div className="chart-box" style={{ height: 200 }}>
          <Bar
            options={opts(dark, false)}
            data={{
              labels,
              datasets: DRINK_TYPES.map((t) => ({
                label: DRINK_LABEL[t],
                data: days.map((d) => d.ml[t]),
                backgroundColor: dc[t],
                borderRadius: 2,
              })),
            }}
          />
        </div>
      </div>

      <div className="box">
        <h2>ช่วงเวลาที่ฉี่ (heatmap)</h2>
        <Heatmap days={days} dark={dark} />
      </div>
    </>
  );
}
