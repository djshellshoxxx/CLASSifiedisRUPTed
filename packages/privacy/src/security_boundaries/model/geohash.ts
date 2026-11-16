// Minimal geohash encoder (snapping points to cell ids, CTR-PRV-001 PRV-1). Pure arithmetic.
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
export const GEOHASH_RE = /^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/;

export function geohashEncode(lat: number, lon: number, length: number): string {
  let latLo = -90;
  let latHi = 90;
  let lonLo = -180;
  let lonHi = 180;
  let out = '';
  let bits = 0;
  let ch = 0;
  let even = true;
  while (out.length < length) {
    if (even) {
      const mid = (lonLo + lonHi) / 2;
      if (lon >= mid) { ch = (ch << 1) | 1; lonLo = mid; } else { ch <<= 1; lonHi = mid; }
    } else {
      const mid = (latLo + latHi) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latLo = mid; } else { ch <<= 1; latHi = mid; }
    }
    even = !even;
    if (++bits === 5) {
      out += BASE32[ch];
      bits = 0;
      ch = 0;
    }
  }
  return out;
}

/** Bounding box of a geohash cell, used by tests and callers that verify a cell contains a point. */
export function geohashBounds(hash: string): { latLo: number; latHi: number; lonLo: number; lonHi: number } {
  let latLo = -90;
  let latHi = 90;
  let lonLo = -180;
  let lonHi = 180;
  let even = true;
  for (const c of hash) {
    const v = BASE32.indexOf(c);
    for (let b = 4; b >= 0; b--) {
      const bit = (v >> b) & 1;
      if (even) { const mid = (lonLo + lonHi) / 2; if (bit) lonLo = mid; else lonHi = mid; }
      else { const mid = (latLo + latHi) / 2; if (bit) latLo = mid; else latHi = mid; }
      even = !even;
    }
  }
  return { latLo, latHi, lonLo, lonHi };
}
