import type { Coordinates, Spot } from './types';
export function distanceKm(a: Coordinates, b: Coordinates) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function matchSpot(point: Coordinates, spots: Spot[]) {
  return spots.filter(s => distanceKm(point, s) * 1000 <= s.radius_m).sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0] ?? null;
}
export function getPosition(timeout = 7000): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('位置情報を利用できません'));
    navigator.geolocation.getCurrentPosition(p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }), reject, { enableHighAccuracy: true, timeout, maximumAge: 30000 });
  });
}
