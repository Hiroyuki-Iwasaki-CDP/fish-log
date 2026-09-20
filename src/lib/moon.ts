import type { Moon } from './types';
// Approximate synodic age anchored to a known new moon (UTC). Not an astronomical ephemeris.
const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
export function moonAt(date: Date): Moon {
  const age = (((date.getTime() - NEW_MOON) / 86400000) % SYNODIC) + SYNODIC;
  const age_days = age % SYNODIC;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * age_days / SYNODIC)) * 50);
  const phase = age_days < 1.85 || age_days >= 27.68 ? '新月' : age_days < 7.38 ? '三日月' : age_days < 9.23 ? '上弦' : age_days < 14.77 ? '十三夜' : age_days < 16.61 ? '満月' : age_days < 22.15 ? '寝待月' : age_days < 23.99 ? '下弦' : '有明月';
  return { age_days: Math.round(age_days * 10) / 10, phase, illumination };
}
