// Test-only helper: encodes at arbitrary precision to check the published 11 character vector. Not exported from index.ts.
import { BASE32 } from './geohash.ts';
export function encodeAny(lat: number, lon: number, precision: number): string {
  let latLo = -90, latHi = 90, lonLo = -180, lonHi = 180, even = true, bit = 0, ch = 0, out = '';
  while (out.length < precision) {
    if (even) { const m = (lonLo + lonHi) / 2; if (lon >= m) { ch = ch * 2 + 1; lonLo = m; } else { ch *= 2; lonHi = m; } }
    else { const m = (latLo + latHi) / 2; if (lat >= m) { ch = ch * 2 + 1; latLo = m; } else { ch *= 2; latHi = m; } }
    even = !even;
    if (++bit === 5) { out += BASE32[ch]; bit = 0; ch = 0; }
  }
  return out;
}
