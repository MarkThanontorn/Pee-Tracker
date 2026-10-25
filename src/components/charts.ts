import { BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Thai', 'Leelawadee UI', sans-serif";

export function useDark() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const [dark, setDark] = useState(mq.matches);
  useEffect(() => {
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [mq]);
  return dark;
}

/** Drink colours on the green panel (Today) and on neutral surfaces (Trends). */
export const DRINK_ON_GREEN = { coffee: '#f0d3a8', alcohol: '#f6a5b8', water: '#a9dcff' };
export const drinkColors = (dark: boolean) =>
  dark
    ? { coffee: '#c99a6b', alcohol: '#e57f97', water: '#5fb5ea' }
    : { coffee: '#8b5a2b', alcohol: '#b8475e', water: '#2f8fd0' };
export const peeColors = (dark: boolean) =>
  dark ? { day: '#5fb5ea', night: '#a58cf0' } : { day: '#2477a0', night: '#4b3a9c' };
