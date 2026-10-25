import { useEffect, useState } from 'react';
import { requestPersistence } from './db';
import { todayKey } from './time';
import Today from './screens/Today';
import Trends from './screens/Trends';
import Logs from './screens/Logs';
import Settings from './screens/Settings';

type Tab = 'today' | 'trends' | 'logs' | 'settings';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today', icon: '💧', label: 'วันนี้' },
  { id: 'trends', icon: '📈', label: 'แนวโน้ม' },
  { id: 'logs', icon: '📝', label: 'บันทึก' },
  { id: 'settings', icon: '⚙️', label: 'ตั้งค่า' },
];

/** Re-evaluates the logical "today" every minute so the app rolls over at 06:00. */
function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    const onVisible = () => document.visibilityState === 'visible' && setToday(todayKey());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return today;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const today = useToday();
  // null = follow today
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked && picked < today ? picked : today;
  const setDay = (k: string) => setPicked(k >= today ? null : k);

  useEffect(() => {
    requestPersistence();
  }, []);

  return (
    <>
      <main className="app">
        {tab === 'today' && <Today day={day} today={today} setDay={setDay} />}
        {tab === 'trends' && <Trends today={today} />}
        {tab === 'logs' && <Logs day={day} today={today} setDay={setDay} />}
        {tab === 'settings' && <Settings />}
      </main>
      <div className="tabbar">
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <span className="ic">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
