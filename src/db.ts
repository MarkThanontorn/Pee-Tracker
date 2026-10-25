import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Drink, DrinkType, Void } from './time';

export type Presets = Record<DrinkType, number[]>;
export const DEFAULT_PRESETS: Presets = {
  coffee: [150, 250, 350],
  alcohol: [150, 330, 500],
  water: [250, 500, 750],
};

class TrackerDB extends Dexie {
  drinks!: Table<Drink, number>;
  voids!: Table<Void, number>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('pee-tracker');
    this.version(1).stores({ drinks: '++id, at, type', voids: '++id, at', settings: 'key' });
  }
}

export const db = new TrackerDB();

/** Live drinks + voids in [start, end). */
export function useRecords(start: number, end: number) {
  return useLiveQuery(
    async () => ({
      drinks: await db.drinks.where('at').between(start, end, true, false).toArray(),
      voids: await db.voids.where('at').between(start, end, true, false).toArray(),
    }),
    [start, end],
  );
}

export function usePresets(): Presets {
  const row = useLiveQuery(() => db.settings.get('presets'), []);
  return (row?.value as Presets | undefined) ?? DEFAULT_PRESETS;
}

export const savePresets = (p: Presets) => db.settings.put({ key: 'presets', value: p });

export interface Backup {
  app: 'pee-tracker';
  version: 1;
  exportedAt: string;
  drinks: Drink[];
  voids: Void[];
  presets: Presets;
}

export async function exportBackup(): Promise<Backup> {
  const presets = ((await db.settings.get('presets'))?.value as Presets | undefined) ?? DEFAULT_PRESETS;
  return {
    app: 'pee-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    drinks: await db.drinks.orderBy('at').toArray(),
    voids: await db.voids.orderBy('at').toArray(),
    presets,
  };
}

/** Replaces all data with the backup. */
export async function importBackup(b: Backup) {
  if (b.app !== 'pee-tracker' || !Array.isArray(b.drinks) || !Array.isArray(b.voids)) throw new Error('ไฟล์ไม่ถูกต้อง');
  await db.transaction('rw', db.drinks, db.voids, db.settings, async () => {
    await db.drinks.clear();
    await db.voids.clear();
    await db.drinks.bulkAdd(b.drinks.map(({ type, ml, at }) => ({ type, ml, at })));
    await db.voids.bulkAdd(b.voids.map(({ at, urgent, pain }) => ({ at, urgent, pain })));
    if (b.presets) await savePresets(b.presets);
  });
}

export async function exportCsv(): Promise<string> {
  const rows: string[] = ['datetime,kind,type,ml,urgent,pain'];
  const iso = (at: number) => {
    const d = new Date(at);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const all = [
    ...(await db.drinks.toArray()).map((d) => ({ at: d.at, line: `drink,${d.type},${d.ml},,` })),
    ...(await db.voids.toArray()).map((v) => ({ at: v.at, line: `pee,,,${v.urgent ? 1 : 0},${v.pain ? 1 : 0}` })),
  ].sort((a, b) => a.at - b.at);
  for (const r of all) rows.push(`${iso(r.at)},${r.line}`);
  return rows.join('\n');
}

/** Ask the browser not to evict our IndexedDB (important on iOS). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

/** Dev helper: 90 days of plausible random data. */
export async function seedDemo() {
  const drinks: Drink[] = [];
  const voids: Void[] = [];
  const now = new Date();
  for (let i = 0; i < 90; i++) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 6).getTime();
    const at = (h: number) => base + (h - 6) * 3600_000 + Math.floor(Math.random() * 50) * 60_000;
    drinks.push({ type: 'coffee', ml: 250, at: at(7) });
    if (Math.random() < 0.6) drinks.push({ type: 'coffee', ml: 150, at: at(13) });
    const late = Math.random() < 0.3;
    if (late) drinks.push({ type: 'alcohol', ml: 330 * (1 + Math.floor(Math.random() * 2)), at: at(20) });
    for (const h of [8, 10, 12, 15, 17, 19]) if (Math.random() < 0.8) drinks.push({ type: 'water', ml: 250, at: at(h) });
    for (const h of [7, 10, 13, 16, 19, 22]) if (Math.random() < 0.85) voids.push({ at: at(h), urgent: Math.random() < 0.08 });
    const night = (late ? 1 : 0) + (Math.random() < 0.35 ? 1 : 0);
    for (let n = 0; n < night; n++) voids.push({ at: at(26 + n * 2) });
  }
  const cutoff = Date.now();
  await db.drinks.bulkAdd(drinks.filter((d) => d.at <= cutoff));
  await db.voids.bulkAdd(voids.filter((v) => v.at <= cutoff));
}

export async function clearAll() {
  await db.drinks.clear();
  await db.voids.clear();
}
