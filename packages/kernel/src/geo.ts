/**
 * Geohash cells (ADR-0006 geoprivacy). Public payloads carry only a coarse cell
 * (precision <= PUBLIC_CELL_PRECISION, ~4.9km x 4.9km) never raw coordinates.
 * Owner of precision policy: F06.S02; this file is the shared primitive.
 */
import { validationError } from './errors';

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
export const PUBLIC_CELL_PRECISION = 5;
export const CELL_RE = /^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/;

export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

export function assertLatLng(p: LatLng): void {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || p.lat < -90 || p.lat > 90 || p.lng < -180 || p.lng > 180) {
    throw validationError('GEO.INVALID_COORDINATES', 'coordinates out of range');
  }
}

export function encodeGeohash(p: LatLng, precision: number): string {
  assertLatLng(p);
  if (!Number.isInteger(precision) || precision < 1 || precision > 12) throw new RangeError('precision 1..12');
  let latLo = -90, latHi = 90, lngLo = -180, lngHi = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lngLo + lngHi) / 2;
      if (p.lng >= mid) { ch = (ch << 1) | 1; lngLo = mid; } else { ch <<= 1; lngHi = mid; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (p.lat >= mid) { ch = (ch << 1) | 1; latLo = mid; } else { ch <<= 1; latHi = mid; }
    }
    even = !even;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

export interface CellBounds {
  readonly minLat: number;
  readonly maxLat: number;
  readonly minLng: number;
  readonly maxLng: number;
}

export function decodeGeohash(cell: string): CellBounds {
  if (!CELL_RE.test(cell)) throw validationError('GEO.INVALID_CELL', 'invalid geohash cell');
  let latLo = -90, latHi = 90, lngLo = -180, lngHi = 180;
  let even = true;
  for (const c of cell) {
    const v = BASE32.indexOf(c);
    for (let b = 4; b >= 0; b--) {
      const on = (v >> b) & 1;
      if (even) {
        const mid = (lngLo + lngHi) / 2;
        if (on) lngLo = mid; else lngHi = mid;
      } else {
        const mid = (latLo + latHi) / 2;
        if (on) latLo = mid; else latHi = mid;
      }
      even = !even;
    }
  }
  return { minLat: latLo, maxLat: latHi, minLng: lngLo, maxLng: lngHi };
}

export const cellCenter = (cell: string): LatLng => {
  const b = decodeGeohash(cell);
  return { lat: (b.minLat + b.maxLat) / 2, lng: (b.minLng + b.maxLng) / 2 };
};

/** Truncate to a coarser cell. Never increases precision. */
export function coarsenCell(cell: string, precision: number): string {
  if (!CELL_RE.test(cell)) throw validationError('GEO.INVALID_CELL', 'invalid geohash cell');
  return cell.slice(0, Math.min(cell.length, precision));
}

/** Validate a cell intended for a public payload (rejects cells finer than the public limit). */
export function assertPublicCell(cell: string): string {
  if (!CELL_RE.test(cell)) throw validationError('GEO.INVALID_CELL', 'invalid geohash cell');
  if (cell.length > PUBLIC_CELL_PRECISION) throw validationError('GEO.TOO_PRECISE', 'location too precise for public use', { max: PUBLIC_CELL_PRECISION });
  return cell;
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_008.8;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The 8 neighbouring cells at the same precision (for coarse proximity search). */
export function neighbors(cell: string): string[] {
  const b = decodeGeohash(cell);
  const dLat = b.maxLat - b.minLat;
  const dLng = b.maxLng - b.minLng;
  const c = cellCenter(cell);
  const out = new Set<string>();
  for (const dy of [-1, 0, 1]) {
    for (const dx of [-1, 0, 1]) {
      if (dx === 0 && dy === 0) continue;
      const lat = c.lat + dy * dLat;
      if (lat > 90 || lat < -90) continue;
      let lng = c.lng + dx * dLng;
      if (lng > 180) lng -= 360;
      if (lng < -180) lng += 360;
      out.add(encodeGeohash({ lat, lng }, cell.length));
    }
  }
  out.delete(cell);
  return [...out];
}
