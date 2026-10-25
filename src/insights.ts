import type { DaySummary } from './time';

export interface Insight {
  level: 'warn' | 'info' | 'good';
  text: string;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Rule-of-thumb observations over a range of days (only days with records count).
 * These are general reference thresholds, not a diagnosis.
 */
export function computeInsights(days: DaySummary[]): Insight[] {
  const logged = days.filter((d) => d.hasData);
  if (logged.length === 0) return [{ level: 'info', text: 'ยังไม่มีข้อมูลในช่วงนี้' }];

  const out: Insight[] = [];
  const dayVoids = avg(logged.map((d) => d.dayVoids));
  const nightVoids = avg(logged.map((d) => d.nightVoids));
  const fluid = avg(logged.map((d) => d.totalMl));
  const totalVoids = logged.reduce((a, d) => a + d.voids, 0);
  const urgent = logged.reduce((a, d) => a + d.urgent, 0);
  const pain = logged.reduce((a, d) => a + d.pain, 0);
  const nocturiaNights = logged.filter((d) => d.nightVoids >= 2).length;
  const shortGaps = avg(logged.map((d) => d.shortGaps));

  if (dayVoids > 8) out.push({ level: 'warn', text: `ฉี่กลางวันเฉลี่ย ${r1(dayVoids)} ครั้ง/วัน (เกิน 8 ครั้ง = ฉี่บ่อย)` });
  if (nocturiaNights > 0 && nocturiaNights / logged.length >= 0.3)
    out.push({ level: 'warn', text: `ตื่นมาฉี่กลางคืน ≥2 ครั้ง ใน ${nocturiaNights} จาก ${logged.length} วัน` });
  if (shortGaps >= 3) out.push({ level: 'warn', text: `ฉี่ห่างกันไม่ถึง 2 ชม. เฉลี่ย ${r1(shortGaps)} ครั้ง/วัน` });
  if (pain > 0) out.push({ level: 'warn', text: `มีอาการปวดแสบ ${pain} ครั้ง — ควรปรึกษาแพทย์` });
  if (totalVoids >= 5 && urgent / totalVoids >= 0.25)
    out.push({ level: 'warn', text: `ปวดเร่งด่วน ${urgent} จาก ${totalVoids} ครั้ง (${Math.round((urgent / totalVoids) * 100)}%)` });

  if (fluid > 0 && fluid < 1500) out.push({ level: 'info', text: `ดื่มรวมเฉลี่ย ${Math.round(fluid)} ml/วัน (น้อยกว่า 1,500 ml)` });
  if (fluid > 3000) out.push({ level: 'info', text: `ดื่มรวมเฉลี่ย ${Math.round(fluid)} ml/วัน (มากกว่า 3,000 ml — อาจทำให้ฉี่บ่อย)` });

  const late = logged.filter((d) => d.lateStimulant);
  const notLate = logged.filter((d) => !d.lateStimulant);
  if (late.length >= 3 && notLate.length >= 3) {
    const a = avg(late.map((d) => d.nightVoids));
    const b = avg(notLate.map((d) => d.nightVoids));
    if (a - b >= 0.5)
      out.push({
        level: 'info',
        text: `วันที่ดื่มกาแฟ/แอลกอฮอล์ช่วงค่ำ–ดึก ฉี่กลางคืนเฉลี่ย ${r1(a)} ครั้ง เทียบกับ ${r1(b)} ครั้งในวันอื่น`,
      });
  }

  if (logged.length >= 14) {
    const recent = logged.slice(-7);
    const earlier = logged.slice(0, -7);
    const a = avg(recent.map((d) => d.voids));
    const b = avg(earlier.map((d) => d.voids));
    const diff = a - b;
    if (Math.abs(diff) >= 1)
      out.push({
        level: 'info',
        text: `7 วันล่าสุดฉี่เฉลี่ย ${r1(a)} ครั้ง/วัน ${diff > 0 ? 'มากขึ้น' : 'น้อยลง'}จากช่วงก่อนหน้า (${r1(b)})`,
      });
  }

  if (!out.some((i) => i.level === 'warn'))
    out.unshift({
      level: 'good',
      text: `ไม่พบสัญญาณผิดปกติตามเกณฑ์ทั่วไป (กลางวัน ${r1(dayVoids)} / กลางคืน ${r1(nightVoids)} ครั้ง/วัน)`,
    });
  return out;
}
