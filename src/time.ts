// A "day" runs 06:00 → 06:00 next morning, split into 7 slots.
export const DAY_START_HOUR = 6;
export const HOUR = 3600_000;

export const SLOTS = [
  { label: 'เช้า', range: '06–09' },
  { label: 'สาย', range: '09–12' },
  { label: 'บ่าย', range: '12–15' },
  { label: 'เย็น', range: '15–18' },
  { label: 'ค่ำ', range: '18–21' },
  { label: 'ดึก', range: '21–24' },
  { label: 'กลางคืน', range: '00–06' },
] as const;

export const NIGHT_SLOT = 6;

export type DrinkType = 'coffee' | 'alcohol' | 'water';
export const DRINK_TYPES: DrinkType[] = ['coffee', 'alcohol', 'water'];
export const DRINK_LABEL: Record<DrinkType, string> = {
  coffee: 'กาแฟ',
  alcohol: 'แอลกอฮอล์',
  water: 'น้ำ',
};
export const DRINK_EN: Record<DrinkType, string> = { coffee: 'Coffee', alcohol: 'Alc', water: 'Water' };

export interface Drink {
  id?: number;
  type: DrinkType;
  ml: number;
  at: number;
}

export interface Void {
  id?: number;
  at: number;
  urgent?: boolean;
  pain?: boolean;
}

export function slotIndex(at: number): number {
  const h = new Date(at).getHours();
  return h < DAY_START_HOUR ? NIGHT_SLOT : Math.floor((h - DAY_START_HOUR) / 3);
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** YYYY-MM-DD of the logical day; 00:00–05:59 belongs to the previous date. */
export function dayKey(at: number): string {
  const d = new Date(at);
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

export const todayKey = () => dayKey(Date.now());

/** [start, end) epoch ms of a logical day. */
export function dayRange(key: string): [number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [new Date(y, m - 1, d, DAY_START_HOUR).getTime(), new Date(y, m - 1, d + 1, DAY_START_HOUR).getTime()];
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return fmtDate(new Date(y, m - 1, d + n));
}

/** Epoch ms for HH:MM on a logical day (times before 06:00 land on the next calendar date). */
export function atOnDay(key: string, hhmm: string): number {
  const [h, min] = hhmm.split(':').map(Number);
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, h < DAY_START_HOUR ? d + 1 : d, h, min).getTime();
}

export const hhmm = (at: number) => {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function formatDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
}

export interface SlotSummary {
  ml: Record<DrinkType, number>;
  drinks: number;
  voids: number;
}

export interface DaySummary {
  key: string;
  slots: SlotSummary[];
  ml: Record<DrinkType, number>;
  drinkCount: Record<DrinkType, number>;
  totalMl: number;
  voids: number;
  dayVoids: number; // 06–24
  nightVoids: number; // 00–06
  shortGaps: number; // consecutive voids < 2 h apart
  urgent: number;
  pain: number;
  lateStimulant: boolean; // coffee or alcohol during ค่ำ/ดึก
  lastVoidAt?: number;
  hasData: boolean;
}

const zeroMl = (): Record<DrinkType, number> => ({ coffee: 0, alcohol: 0, water: 0 });

/** Summarise one logical day. Records outside the day are ignored. */
export function summarize(key: string, drinks: Drink[], voids: Void[]): DaySummary {
  const [start, end] = dayRange(key);
  const inDay = <T extends { at: number }>(r: T) => r.at >= start && r.at < end;
  const ds = drinks.filter(inDay);
  const vs = voids.filter(inDay).sort((a, b) => a.at - b.at);

  const slots: SlotSummary[] = SLOTS.map(() => ({ ml: zeroMl(), drinks: 0, voids: 0 }));
  const ml = zeroMl();
  const drinkCount = zeroMl();
  let lateStimulant = false;
  for (const d of ds) {
    const s = slotIndex(d.at);
    slots[s].ml[d.type] += d.ml;
    slots[s].drinks++;
    ml[d.type] += d.ml;
    drinkCount[d.type]++;
    if (d.type !== 'water' && (s === 4 || s === 5)) lateStimulant = true;
  }

  let shortGaps = 0;
  vs.forEach((v, i) => {
    slots[slotIndex(v.at)].voids++;
    if (i > 0 && v.at - vs[i - 1].at < 2 * HOUR) shortGaps++;
  });
  const nightVoids = slots[NIGHT_SLOT].voids;

  return {
    key,
    slots,
    ml,
    drinkCount,
    totalMl: ml.coffee + ml.alcohol + ml.water,
    voids: vs.length,
    dayVoids: vs.length - nightVoids,
    nightVoids,
    shortGaps,
    urgent: vs.filter((v) => v.urgent).length,
    pain: vs.filter((v) => v.pain).length,
    lateStimulant,
    lastVoidAt: vs.at(-1)?.at,
    hasData: ds.length + vs.length > 0,
  };
}

/** Summaries for `days` logical days ending at `lastKey` (oldest first). */
export function summarizeRange(lastKey: string, days: number, drinks: Drink[], voids: Void[]): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(summarize(addDays(lastKey, -i), drinks, voids));
  return out;
}
