import { describe, expect, it } from 'vitest';
import { computeInsights } from '../insights';
import { addDays, summarize, type Drink, type Void } from '../time';

const at = (key: string, h: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, h < 6 ? d + 1 : d, h).getTime();
};

function days(n: number, perDay: (key: string, i: number) => { drinks: Drink[]; voids: Void[] }) {
  const drinks: Drink[] = [];
  const voids: Void[] = [];
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    const key = addDays('2026-10-01', i);
    keys.push(key);
    const r = perDay(key, i);
    drinks.push(...r.drinks);
    voids.push(...r.voids);
  }
  return keys.map((k) => summarize(k, drinks, voids));
}

describe('computeInsights', () => {
  it('reports no data', () => {
    expect(computeInsights(days(3, () => ({ drinks: [], voids: [] })))[0].text).toContain('ยังไม่มีข้อมูล');
  });

  it('is good for a normal pattern', () => {
    const s = days(7, (k) => ({
      drinks: [8, 11, 14, 17].map((h) => ({ type: 'water' as const, ml: 500, at: at(k, h) })),
      voids: [7, 11, 15, 19, 22].map((h) => ({ at: at(k, h) })),
    }));
    const out = computeInsights(s);
    expect(out[0].level).toBe('good');
    expect(out.some((i) => i.level === 'warn')).toBe(false);
  });

  it('flags frequency, nocturia and pain', () => {
    const s = days(7, (k) => ({
      drinks: [{ type: 'water', ml: 2000, at: at(k, 9) }],
      voids: [
        ...[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => ({ at: at(k, h) })),
        { at: at(k, 1), pain: true },
        { at: at(k, 4) },
      ],
    }));
    const text = computeInsights(s).map((i) => i.text).join('\n');
    expect(text).toContain('ฉี่บ่อย');
    expect(text).toContain('กลางคืน ≥2');
    expect(text).toContain('ปวดแสบ');
  });

  it('links late caffeine/alcohol to night voids', () => {
    const s = days(8, (k, i) => {
      const late = i % 2 === 0;
      return {
        drinks: [
          { type: 'water', ml: 1800, at: at(k, 9) },
          ...(late ? [{ type: 'alcohol' as const, ml: 330, at: at(k, 20) }] : []),
        ],
        voids: [7, 12, 17, 22].map((h) => ({ at: at(k, h) })).concat(late ? [{ at: at(k, 3) }] : []),
      };
    });
    expect(computeInsights(s).some((i) => i.text.includes('ช่วงค่ำ–ดึก'))).toBe(true);
  });
});
