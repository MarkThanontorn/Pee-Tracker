import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';

Chart.register(BarController, LineController, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.font.family = "'IBM Plex Sans Thai', system-ui, -apple-system, 'Segoe UI', sans-serif";

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

/** Keep in sync with the --coffee / --alcohol / --water / --pee tokens in styles.css. */
export function palette(dark: boolean) {
  return dark
    ? {
        coffee: '#d9a46c',
        alcohol: '#f07a9b',
        water: '#46b8f0',
        pee: '#9d98ff',
        peeNight: '#5b55c9',
        text: '#9aa1ad',
        grid: '#262b35',
        surface: '#171a21',
      }
    : {
        coffee: '#b5773b',
        alcohol: '#d6456d',
        water: '#0f9fe0',
        pee: '#5b54e8',
        peeNight: '#2f2a8c',
        text: '#6b7280',
        grid: '#eef0f4',
        surface: '#ffffff',
      };
}
