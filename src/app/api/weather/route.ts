import { NextRequest, NextResponse } from 'next/server';
import type { Weather } from '@/lib/types';
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const lat = Number(q.get('lat')), lon = Number(q.get('lon'));
  const at = new Date(q.get('at') || '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || Number.isNaN(at.getTime())) return NextResponse.json({ error: 'Invalid coordinates or time' }, { status: 400 });
  try {
    const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure', wind_speed_unit: 'ms', timezone: 'GMT', start_date: at.toISOString().slice(0, 10), end_date: at.toISOString().slice(0, 10) });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(6500) });
    if (!response.ok) throw new Error('Open-Meteo unavailable');
    const result = await response.json();
    const times: string[] = result.hourly?.time || [];
    if (!times.length) throw new Error('No hourly weather');
    const index = times.reduce((best, t, i) => Math.abs(new Date(`${t}Z`).getTime() - at.getTime()) < Math.abs(new Date(`${times[best]}Z`).getTime() - at.getTime()) ? i : best, 0);
    const value = (key: string) => result.hourly[key]?.[index] ?? null;
    const weather: Weather = { temperature_c: value('temperature_2m'), wind_speed_ms: value('wind_speed_10m'), wind_direction_deg: value('wind_direction_10m'), pressure_hpa: value('surface_pressure'), weather_code: value('weather_code'), source: 'Open-Meteo forecast' };
    return NextResponse.json(weather);
  } catch { return NextResponse.json({ error: 'Weather unavailable' }, { status: 503 }); }
}
