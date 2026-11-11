// Internal exact geohash arithmetic (standard base32 geohash, bit 0 = longitude). Pure; no validation of ranges here.
export const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const CHAR_INDEX: Readonly<Record<string, number>> = Object.fromEntries([...BASE32].map((c, i) => [c, i]));

export interface Grid { readonly latBits: number; readonly lonBits: number; }
export function gridFor(precision: number): Grid {
  const bits = precision * 5;
  return { lonBits: Math.ceil(bits / 2), latBits: Math.floor(bits / 2) };
}

/** Bisection with >= on the midpoint: exact because every midpoint is a dyadic rational. */
function bisect(value: number, lo: number, hi: number, bits: number): number {
  let idx = 0;
  for (let i = 0; i < bits; i++) {
    const mid = (lo + hi) / 2;
    idx *= 2;
    if (value >= mid) { idx += 1; lo = mid; } else hi = mid;
  }
  return idx;
}

export function indicesOf(lat: number, lon: number, precision: number): { latIdx: number; lonIdx: number } {
  const g = gridFor(precision);
  return { latIdx: bisect(lat, -90, 90, g.latBits), lonIdx: bisect(lon, -180, 180, g.lonBits) };
}

export function cellFromIndices(precision: number, latIdx: number, lonIdx: number): string {
  const g = gridFor(precision);
  let out = '';
  for (let k = 0; k < precision; k++) {
    let v = 0;
    for (let b = 0; b < 5; b++) {
      const i = k * 5 + b;
      const bit = i % 2 === 0
        ? Math.floor(lonIdx / 2 ** (g.lonBits - 1 - i / 2)) % 2
        : Math.floor(latIdx / 2 ** (g.latBits - 1 - (i - 1) / 2)) % 2;
      v = v * 2 + bit;
    }
    out += BASE32[v];
  }
  return out;
}

/** The cell must already be validated (lowercase base32 characters only). */
export function indicesOfCell(cell: string): { latIdx: number; lonIdx: number } {
  let latIdx = 0; let lonIdx = 0;
  for (let k = 0; k < cell.length; k++) {
    const v = CHAR_INDEX[cell[k] as string] as number;
    for (let b = 0; b < 5; b++) {
      const bit = (v >> (4 - b)) & 1;
      if ((k * 5 + b) % 2 === 0) lonIdx = lonIdx * 2 + bit; else latIdx = latIdx * 2 + bit;
    }
  }
  return { latIdx, lonIdx };
}

export interface Bounds { readonly latMin: number; readonly latMax: number; readonly lonMin: number; readonly lonMax: number; }
export function boundsOf(precision: number, latIdx: number, lonIdx: number): Bounds {
  const g = gridFor(precision);
  const h = 180 / 2 ** g.latBits; const w = 360 / 2 ** g.lonBits;
  return { latMin: -90 + latIdx * h, latMax: -90 + (latIdx + 1) * h, lonMin: -180 + lonIdx * w, lonMax: -180 + (lonIdx + 1) * w };
}

export const EARTH_RADIUS_KM = 6371.0088;
const rad = (d: number) => d * Math.PI / 180;
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Shortest signed longitude difference in degrees, in (-180, 180]. */
export function lonDelta(a: number, b: number): number {
  let d = (b - a) % 360;
  if (d > 180) d -= 360; else if (d <= -180) d += 360;
  return d;
}

/** Exact minimum great-circle distance in km from a point to a lat/lon rectangle (cell). */
export function minDistanceKm(lat0: number, lon0: number, b: Bounds): number {
  const dLonMin = lonDelta(lon0, b.lonMin); const dLonMax = lonDelta(lon0, b.lonMax);
  // Centre longitude inside the cell range when the signed deltas straddle zero (cells are far narrower than 180 degrees).
  const inside = dLonMin <= 0 && dLonMax >= 0;
  if (inside) {
    const lat = Math.min(b.latMax, Math.max(b.latMin, lat0));
    return haversineKm(lat0, lon0, lat, lon0);
  }
  const edgeLon = Math.abs(dLonMin) <= Math.abs(dLonMax) ? b.lonMin : b.lonMax;
  const dl = Math.abs(lonDelta(lon0, edgeLon));
  // Closest point on a meridian edge: tan(phi*) = tan(phi0) / cos(dl) (dl < 90 degrees here).
  const phiStar = dl < 90 ? Math.atan(Math.tan(rad(lat0)) / Math.cos(rad(dl))) * 180 / Math.PI : lat0;
  const lat = Math.min(b.latMax, Math.max(b.latMin, phiStar));
  return haversineKm(lat0, lon0, lat, edgeLon);
}
