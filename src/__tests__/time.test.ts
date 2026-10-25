import { describe, expect, it } from 'vitest';
import { addDays, atOnDay, dayKey, dayRange, slotIndex, summarize, type Drink, type Void } from '../time';

const t = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).getTime();

describe('dayKey', () => {
  it('counts 00:00–05:59 as the previous day', () => {
    expect(dayKey(t(2026, 10, 26, 3))).toBe('2026-10-25');
    expect(dayKey(t(2026, 10, 26, 5, 59))).toBe('2026-10-25');
  });
  it('starts a new day at 06:00', () => {
    expect(dayKey(t(2026, 10, 26, 6))).toBe('2026-10-26');
  });
  it('handles month boundaries', () => {
    expect(dayKey(t(2026, 11, 1, 2))).toBe('2026-10-31');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('slotIndex', () => {
  it.each([
    [6, 0], [8, 0], [9, 1], [12, 2], [15, 3], [18, 4], [21, 5], [23, 5], [0, 6], [3, 6], [5, 6],
  ])('hour %i → slot %i', (h, s) => {
    expect(slotIndex(t(2026, 10, 25, h, 30))).toBe(s);
  });
});

describe('dayRange / atOnDay', () => {
  it('spans 06:00 to 06:00 next day', () => {
    expect(dayRange('2026-10-25')).toEqual([t(2026, 10, 25, 6), t(2026, 10, 26, 6)]);
  });
  it('places early-morning times on the next calendar date', () => {
    expect(atOnDay('2026-10-25', '03:15')).toBe(t(2026, 10, 26, 3, 15));
    expect(atOnDay('2026-10-25', '14:00')).toBe(t(2026, 10, 25, 14));
  });
});

describe('summarize', () => {
  const drinks: Drink[] = [
    { type: 'coffee', ml: 250, at: t(2026, 10, 25, 7) },
    { type: 'water', ml: 500, at: t(2026, 10, 25, 10) },
    { type: 'alcohol', ml: 330, at: t(2026, 10, 25, 20) },
    { type: 'water', ml: 999, at: t(2026, 10, 26, 7) }, // next day
  ];
  const voids: Void[] = [
    { at: t(2026, 10, 25, 8) },
    { at: t(2026, 10, 25, 9), urgent: true },
    { at: t(2026, 10, 25, 14) },
    { at: t(2026, 10, 26, 3), pain: true }, // night of the 25th
  ];
  const s = summarize('2026-10-25', drinks, voids);

  it('totals drinks by type and slot', () => {
    expect(s.ml).toEqual({ coffee: 250, alcohol: 330, water: 500 });
    expect(s.totalMl).toBe(1080);
    expect(s.slots[0].ml.coffee).toBe(250);
    expect(s.slots[4].ml.alcohol).toBe(330);
    expect(s.lateStimulant).toBe(true);
  });

  it('counts voids by day/night and short gaps', () => {
    expect(s.voids).toBe(4);
    expect(s.nightVoids).toBe(1);
    expect(s.dayVoids).toBe(3);
    expect(s.slots[6].voids).toBe(1);
    expect(s.shortGaps).toBe(1); // 08:00 → 09:00
    expect(s.urgent).toBe(1);
    expect(s.pain).toBe(1);
  });
});
