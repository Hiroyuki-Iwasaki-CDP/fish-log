import type { Coordinates, Tide, Weather } from './types';
export interface WeatherProvider { get(point: Coordinates, at: Date): Promise<Weather> }
export interface TideProvider { get(point: Coordinates, at: Date): Promise<Tide> }
async function request<T>(path: string, point: Coordinates, at: Date): Promise<T> {
  const params = new URLSearchParams({ lat: String(point.latitude), lon: String(point.longitude), at: at.toISOString() });
  const response = await fetch(`${path}?${params}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json() as Promise<T>;
}
export const openMeteoWeather: WeatherProvider = { get: (point, at) => request('/api/weather', point, at) };
export const jmaTide: TideProvider = { get: (point, at) => request('/api/tide', point, at) };
