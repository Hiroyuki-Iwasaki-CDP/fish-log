import { NextRequest, NextResponse } from 'next/server';
import stations from '@/data/jma-stations.json';
import { distanceKm } from '@/lib/geo';
import type { TideExtreme } from '@/lib/types';
const JST = 9 * 3600000;
function parseLine(line: string, target: Date): { hours: number[]; extremes: TideExtreme[] } | null {
  const local = new Date(target.getTime() + JST);
  const yy = Number(line.slice(72, 74)), month = Number(line.slice(74, 76)), day = Number(line.slice(76, 78));
  if (yy !== local.getUTCFullYear() % 100 || month !== local.getUTCMonth() + 1 || day !== local.getUTCDate()) return null;
  const hours = Array.from({ length: 24 }, (_, i) => Number(line.slice(i * 3, i * 3 + 3)));
  const extremes: TideExtreme[] = [];
  for (let i = 0; i < 8; i++) {
    const pos = 80 + i * 7;
    const clock = line.slice(pos, pos + 4);
    const height = Number(line.slice(pos + 4, pos + 7));
    if (clock === '9999' || height === 999) continue;
    const h = Number(clock.slice(0, 2)), m = Number(clock.slice(2, 4));
    if (h > 23 || m > 59) continue;
    extremes.push({ at: new Date(Date.UTC(local.getUTCFullYear(), month - 1, day, h, m) - JST).toISOString(), height_cm: height, kind: i < 4 ? 'high' : 'low' });
  }
  return { hours, extremes };
}
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const point = { latitude: Number(q.get('lat')), longitude: Number(q.get('lon')) };
  const at = new Date(q.get('at') || '');
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180 || Number.isNaN(at.getTime())) return NextResponse.json({ error: 'Invalid coordinates or time' }, { status: 400 });
  const station = [...stations].sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0];
  const distance_km = Math.round(distanceKm(point, station) * 10) / 10;
  try {
    const year = new Date(at.getTime() + JST).getUTCFullYear();
    const response = await fetch(`https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/${year}/${station.code}.txt`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('JMA unavailable');
    const lines = (await response.text()).split(/\r?\n/);
    const line = lines.map(x => parseLine(x, at)).find(Boolean);
    if (!line) throw new Error('No tide day');
    const local = new Date(at.getTime() + JST);
    const hour = local.getUTCHours(), fraction = local.getUTCMinutes() / 60;
    const current = line.hours[hour], next = line.hours[(hour + 1) % 24];
    const height_cm = Number.isFinite(current) && Number.isFinite(next) ? Math.round(current + (next - current) * fraction) : null;
    const slope = next - current;
    const state = !Number.isFinite(slope) ? null : Math.abs(slope) < 2 ? 'slack' : slope > 0 ? 'rising' : 'falling';
    const adjacent = [-1, 1].flatMap(offset => { const day = new Date(at.getTime() + offset * 86400000); return lines.map(x => parseLine(x, day)).find(Boolean)?.extremes ?? []; });
    const sorted = [...line.extremes, ...adjacent].sort((a, b) => a.at.localeCompare(b.at));
    return NextResponse.json({ station_code: station.code, station_name: station.name, distance_km, height_cm, state, previous_extreme: [...sorted].reverse().find(x => x.at <= at.toISOString()) ?? null, next_extreme: sorted.find(x => x.at > at.toISOString()) ?? null, source: 'JMA predicted tide table (hourly interpolation)' });
  } catch { return NextResponse.json({ station_code: station.code, station_name: station.name, distance_km, height_cm: null, state: null, previous_extreme: null, next_extreme: null, source: 'JMA unavailable' }); }
}
