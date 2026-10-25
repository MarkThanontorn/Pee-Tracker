import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { useRecords } from '../db';
import { computeInsights } from '../insights';
import { addDays, dayRange, DRINK_LABEL, DRINK_TYPES, summarizeRange, type DaySummary } from '../time';
import { palette, useDark } from '../components/charts';
import Heatmap from '../components/Heatmap';
import { AlertIcon, CheckIcon, InfoIcon } from '../components/Icons';

const RANGES = [7, 30, 90] as const;

const short = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${d}/${m}`;
};

function opts(dark: boolean, integer: boolean, many: boolean): ChartOptions<'bar'> {
  const c = palette(dark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: { legend: { position: 'bottom', labels: { color: c.text, boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3, font: { size: 11 } } } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: c.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: c.text, precision: integer ? 0 : undefined, maxTicksLimit: 5, font: { size: 10 } },
        grid: { color: c.grid },
        border: { display: false },
      },
    },
    datasets: { bar: { borderRadius: many ? 2 : 6, barPercentage: many ? 0.9 : 0.6, categoryPercentage: many ? 0.9 : 0.8 } },
  };
}

function avg(days: DaySummary[], f: (d: DaySummary) => number) {
  const logged = days.filter((d) => d.hasData);
  return logged.length ? logged.reduce((a, d) => a + f(d), 0) / logged.length : 0;
}

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : (Math.round(n * 10) / 10).toString());

export default function Trends({ today }: { today: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const dark = useDark();
  const c = palette(dark);
  const first = addDays(today, -(range - 1));
  const rec = useRecords(dayRange(first)[0], dayRange(today)[1]);
  const days = summarizeRange(today, range, rec?.drinks ?? [], rec?.voids ?? []);
  const insights = computeInsights(days);
  const labels = days.map((d) => short(d.key));
  const logged = days.filter((d) => d.hasData).length;
  const many = range > 7;

  const stats = [
    { tone: 't-pee', value: avg(days, (d) => d.voids), label: 'ฉี่ / วัน' },
    { tone: 't-pee', value: avg(days, (d) => d.nightVoids), label: 'ฉี่กลางคืน' },
    { tone: '', value: avg(days, (d) => d.totalMl), label: 'ดื่มรวม ml' },
    { tone: 't-water', value: avg(days, (d) => d.ml.water), label: 'น้ำ ml' },
    { tone: 't-coffee', value: avg(days, (d) => d.ml.coffee), label: 'กาแฟ ml' },
    { tone: 't-alcohol', value: avg(days, (d) => d.ml.alcohol), label: 'แอลกอฮอล์ ml' },
  ];

  return (
    <>
      <header className="top">
        <div>
          <div className="eyebrow">ภาพรวม</div>
          <h1>แนวโน้ม</h1>
        </div>
      </header>
      <div className="segment">
        {RANGES.map((r) => (
          <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
            {r === 90 ? '3 เดือน' : `${r} วัน`}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>เฉลี่ยต่อวัน</h2>
          <span className="aside">
            บันทึก {logged}/{range} วัน
          </span>
        </div>
        <div className="stats">
          {stats.map((s) => (
            <div key={s.label} className={`stat ${s.tone}`}>
              <b>{fmt(s.value)}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>ข้อสังเกต</h2>
        </div>
        {insights.map((i) => {
          const Icon = i.level === 'warn' ? AlertIcon : i.level === 'good' ? CheckIcon : InfoIcon;
          return (
            <div key={i.text} className={`insight ${i.level}`}>
              <Icon size={20} />
              <span>{i.text}</span>
            </div>
          );
        })}
        <p className="note">อ้างอิงเกณฑ์ทั่วไป ไม่ใช่การวินิจฉัย หากมีอาการต่อเนื่องควรปรึกษาแพทย์ (ส่งออก CSV ได้ในหน้าตั้งค่า)</p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>การฉี่ต่อวัน</h2>
          <span className="aside">ครั้ง</span>
        </div>
        <div className="chart-box" style={{ height: 210 }}>
          <Bar
            options={opts(dark, true, many)}
            data={{
              labels,
              datasets: [
                { label: 'กลางวัน 06–24', data: days.map((d) => d.dayVoids), backgroundColor: c.pee },
                { label: 'กลางคืน 00–06', data: days.map((d) => d.nightVoids), backgroundColor: c.peeNight },
              ],
            }}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>การดื่มต่อวัน</h2>
          <span className="aside">ml</span>
        </div>
        <div className="chart-box" style={{ height: 210 }}>
          <Bar
            options={opts(dark, false, many)}
            data={{
              labels,
              datasets: DRINK_TYPES.map((t) => ({ label: DRINK_LABEL[t], data: days.map((d) => d.ml[t]), backgroundColor: c[t] })),
            }}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>ช่วงเวลาที่ฉี่</h2>
          <span className="aside">เข้ม = บ่อย</span>
        </div>
        <Heatmap days={days} />
      </section>
    </>
  );
}
