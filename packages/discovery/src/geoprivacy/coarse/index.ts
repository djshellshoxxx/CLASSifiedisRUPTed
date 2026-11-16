// F06.S02.M01 Coarse location regions (PS-047): pure, isomorphic geohash library. No commands, queries, events or capabilities.
import { appError, defineErrors, err, ok, type AppError, type Result } from '@classrup/kernel';
import { boundsOf, cellFromIndices, gridFor, haversineKm, indicesOf, indicesOfCell, minDistanceKm } from './geohash.ts';

export const MODULE_ID = 'F06.S02.M01';
export type Cell = string;
export type Level = 'L0' | 'L1' | 'L2' | 'L3';
export type Bucket = 'lt5' | '5_10' | '10_25' | '25_50' | 'gt50';
export type Precision = 4 | 5 | 6;
export type RadiusKm = 5 | 10 | 25 | 50 | 100;

export const RADII_KM: readonly RadiusKm[] = [5, 10, 25, 50, 100];
export const BUCKETS: readonly Bucket[] = ['lt5', '5_10', '10_25', '25_50', 'gt50'];
export const MAX_CELLS = 512;
export const MAX_PUBLIC_CELL_LENGTH = 5;
/** CTR-PRV-001 level to geohash precision; L4 (exact) is never produced. */
export const LEVEL_PRECISION: Readonly<Record<'L1' | 'L2' | 'L3', Precision>> = { L1: 4, L2: 5, L3: 6 };
export const BUCKET_MESSAGE_KEYS: Readonly<Record<Bucket, string>> = {
  lt5: 'discovery.bucket.lt5', '5_10': 'discovery.bucket.5_10', '10_25': 'discovery.bucket.10_25', '25_50': 'discovery.bucket.25_50', gt50: 'discovery.bucket.gt50',
};

/** Module-specific error codes, defined once here (ERR-1). */
export const discoveryGeoErrors = defineErrors({
  DISCOVERY_COORD_INVALID: { status: 422, retryable: false },
  DISCOVERY_PRECISION_FORBIDDEN: { status: 422, retryable: false },
  DISCOVERY_RADIUS_TOO_SMALL: { status: 422, retryable: false },
  DISCOVERY_RADIUS_TOO_LARGE: { status: 422, retryable: false },
});
type GeoCode = keyof typeof discoveryGeoErrors.codes;
const geoErr = (code: GeoCode, path?: string): Result<never, AppError> =>
  err(discoveryGeoErrors.make(code, path ? { fields: [{ path, code }] } : undefined));
const invalid = (path: string): Result<never, AppError> => err(appError('VALIDATION_FAILED', { fields: [{ path, code: 'invalid' }] }));

const CELL_RE = /^[0123456789bcdefghjkmnpqrstuvwxyz]+$/;
const validCoords = (lat: unknown, lon: unknown): lat is number =>
  typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
const isPrecision = (p: unknown): p is Precision => p === 4 || p === 5 || p === 6;
/** A Cell is a lowercase geohash of 4..6 characters; anything else is rejected, never repaired. */
export function isCell(cell: unknown): cell is Cell {
  return typeof cell === 'string' && cell.length >= 4 && cell.length <= 6 && CELL_RE.test(cell);
}

export function encode(lat: number, lon: number, precision: Precision): Result<Cell, AppError> {
  if (!validCoords(lat, lon)) return geoErr('DISCOVERY_COORD_INVALID');
  if (!isPrecision(precision)) return invalid('precision');
  const { latIdx, lonIdx } = indicesOf(lat, lon, precision);
  return ok(cellFromIndices(precision, latIdx, lonIdx));
}

export interface CellBounds { readonly latMin: number; readonly latMax: number; readonly lonMin: number; readonly lonMax: number; }
export interface DecodedCell { readonly lat: number; readonly lon: number; readonly bounds: CellBounds; }
/** Centre and bounds of a cell. The centre is the cell's, never an input coordinate. */
export function decode(cell: Cell): Result<DecodedCell, AppError> {
  if (!isCell(cell)) return invalid('cell');
  const { latIdx, lonIdx } = indicesOfCell(cell);
  const b = boundsOf(cell.length, latIdx, lonIdx);
  return ok({ lat: (b.latMin + b.latMax) / 2, lon: (b.lonMin + b.lonMax) / 2, bounds: b });
}

/** Up to 8 neighbours, sorted and unique. Longitude wraps across 180; there is no row beyond a pole, so polar cells have 5. */
export function neighbors(cell: Cell): Result<Cell[], AppError> {
  if (!isCell(cell)) return invalid('cell');
  const p = cell.length; const g = gridFor(p);
  const rows = 2 ** g.latBits; const cols = 2 ** g.lonBits;
  const { latIdx, lonIdx } = indicesOfCell(cell);
  const out = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    const r = latIdx + dr;
    if (r < 0 || r >= rows) continue;
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      out.add(cellFromIndices(p, r, (lonIdx + dc + cols) % cols));
    }
  }
  return ok([...out].sort());
}

/** Snaps to the cell of the level. L0 means no location and yields the empty string. Points are snapped, never jittered. */
export function snap(lat: number, lon: number, level: Level): Result<Cell, AppError> {
  if (!validCoords(lat, lon)) return geoErr('DISCOVERY_COORD_INVALID');
  if (level === 'L0') return ok('');
  if (level !== 'L1' && level !== 'L2' && level !== 'L3') return invalid('level');
  return encode(lat, lon, LEVEL_PRECISION[level]);
}

/** The single enforcement point of the public maximum (N8): accepts only length 0, 4 or 5 (V03). */
export function assertPublicCell(cell: string): Result<Cell, AppError> {
  if (typeof cell !== 'string' || (cell.length > 0 && !CELL_RE.test(cell))) return invalid('cell');
  if (cell.length === 0 || cell.length === 4 || cell.length === 5) return ok(cell);
  return geoErr('DISCOVERY_PRECISION_FORBIDDEN', 'cell');
}

/** Cells (precision 5 up to 25 km, precision 4 above) whose rectangle intersects the circle; sorted, unique, at most 512. */
export function cellsForRadius(centerCell: Cell, radiusKm: number): Result<Cell[], AppError> {
  if (!isCell(centerCell)) return invalid('centerCell');
  if (!RADII_KM.includes(radiusKm as RadiusKm)) return geoErr('DISCOVERY_RADIUS_TOO_SMALL', 'radiusKm');
  const c = decode(centerCell);
  if (!c.ok) return c;
  const { lat: lat0, lon: lon0 } = c.value;
  const p: Precision = radiusKm <= 25 ? 5 : 4;
  const g = gridFor(p);
  const rows = 2 ** g.latBits; const cols = 2 ** g.lonBits;
  const h = 180 / rows; const w = 360 / cols;
  const angR = radiusKm / 6371.0088; // radians
  const dLatDeg = angR * 180 / Math.PI;
  const rMin = Math.max(0, Math.floor((lat0 - dLatDeg + 90) / h) - 1);
  const rMax = Math.min(rows - 1, Math.floor((lat0 + dLatDeg + 90) / h) + 1);
  // Longitude reach: all columns when the circle contains a pole, otherwise asin(sin(r)/cos(lat0)) plus a cell margin.
  const cosLat = Math.cos(lat0 * Math.PI / 180);
  const poleIn = Math.abs(lat0) + dLatDeg >= 90 || Math.sin(angR) >= cosLat;
  const lonCentre = Math.floor((lon0 + 180) / w);
  let span = cols; // number of columns each side
  if (!poleIn) span = Math.min(cols, Math.ceil((Math.asin(Math.sin(angR) / cosLat) * 180 / Math.PI) / w) + 1);
  const colSet = new Set<number>();
  if (span * 2 + 1 >= cols) for (let i = 0; i < cols; i++) colSet.add(i);
  else for (let d = -span; d <= span; d++) colSet.add(((lonCentre + d) % cols + cols) % cols);
  const found: string[] = [];
  for (let r = rMin; r <= rMax; r++) {
    for (const col of colSet) {
      if (minDistanceKm(lat0, lon0, boundsOf(p, r, col)) <= radiusKm) {
        found.push(cellFromIndices(p, r, col));
        if (found.length > MAX_CELLS) return geoErr('DISCOVERY_RADIUS_TOO_LARGE', 'radiusKm');
      }
    }
  }
  return ok(found.sort());
}

const BUCKET_EDGES_KM = [5, 10, 25, 50] as const;
/** Bucket of the cell-centre to cell-centre distance; the number itself is never returned (T03). */
export function bucketBetween(cellA: Cell, cellB: Cell): Result<Bucket, AppError> {
  const a = decode(cellA); if (!a.ok) return a;
  const b = decode(cellB); if (!b.ok) return b;
  const d = haversineKm(a.value.lat, a.value.lon, b.value.lat, b.value.lon);
  const i = BUCKET_EDGES_KM.findIndex(edge => d < edge);
  return ok(BUCKETS[i === -1 ? 4 : i] as Bucket);
}

export interface PublisherContractReport { readonly rejected: readonly string[]; readonly accepted: readonly string[]; }
/**
 * Contract helper for every publishing module (T02 of PS-047, N8): feeds 6 and 11 character cells to the publish function and
 * fails when it lets any of them through. The publisher returns a Result or throws when it rejects.
 */
export async function checkPublisherGuardsCells(publish: (cell: string) => unknown | Promise<unknown>): Promise<Result<PublisherContractReport, AppError>> {
  const probes = ['u4pruy', 'u4pruydqqvj'];
  const rejected: string[] = []; const accepted: string[] = [];
  for (const cell of probes) {
    let refused = false;
    try {
      const r = await publish(cell);
      refused = typeof r === 'object' && r !== null && (r as { ok?: unknown }).ok === false;
    } catch { refused = true; }
    (refused ? rejected : accepted).push(cell);
  }
  if (accepted.length > 0) return geoErr('DISCOVERY_PRECISION_FORBIDDEN', 'publisher');
  return ok({ rejected, accepted });
}

