/**
 * F10.S02.M03 metadata minimisation utilities shared by every feature: disclosure filtering,
 * timestamp coarsening, IP truncation and a guard that keeps coordinates, addresses and contact
 * details out of public payloads, events and logs.
 */
import type { DisclosureClass } from '@classrup/kernel';
import { DAY, HOUR, MINUTE, validationError } from '@classrup/kernel';
import { canDisclose } from './model';
import type { ViewerRelation } from './model';

export type { ViewerRelation } from './model';

/**
 * Keeps only the top-level fields the viewer may see. Fields with no declared class are dropped
 * (deny by default), and `secret` fields are never returned to anyone.
 */
export function filterByDisclosure<T extends Record<string, unknown>>(
  record: T,
  fieldClasses: Readonly<Partial<Record<keyof T & string, DisclosureClass>>>,
  relation: ViewerRelation,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(record) as (keyof T & string)[]) {
    const cls = fieldClasses[key];
    if (cls !== undefined && canDisclose(cls, relation)) out[key] = record[key];
  }
  return out;
}

export type TimestampGranularity = 'minute' | 'hour' | 'day' | 'week';

const GRANULES: Readonly<Record<TimestampGranularity, number>> = { minute: MINUTE, hour: HOUR, day: DAY, week: 7 * DAY };
/** The Unix epoch was a Thursday; weeks start on Monday 00:00 UTC, four days later. */
const WEEK_ORIGIN_MS = 4 * DAY;

/** Floors a timestamp to the start of its UTC minute, hour, day or Monday-based week (the first week starts before the epoch). */
export function coarsenTimestamp(ms: number, granularity: TimestampGranularity): number {
  if (!Number.isSafeInteger(ms)) throw new RangeError('timestamp must be a safe integer');
  const size = GRANULES[granularity];
  if (granularity === 'week') return Math.floor((ms - WEEK_ORIGIN_MS) / size) * size + WEEK_ORIGIN_MS;
  return Math.floor(ms / size) * size;
}

const IPV4_OCTET = /^(0|[1-9]\d{0,2})$/;
const HEX_GROUP = /^[0-9a-fA-F]{1,4}$/;

function parseIpv4(text: string): number[] | undefined {
  const parts = text.split('.');
  if (parts.length !== 4 || !parts.every((p) => IPV4_OCTET.test(p) && Number(p) <= 255)) return undefined;
  return parts.map(Number);
}

/** Expands one side of `::`; an embedded IPv4 tail (`::ffff:1.2.3.4`) is only legal at the very end. */
function expandGroups(side: string, allowV4Tail: boolean): number[] | undefined {
  if (side === '') return [];
  const parts = side.split(':');
  const out: number[] = [];
  for (const [i, part] of parts.entries()) {
    if (part.includes('.')) {
      const v4 = allowV4Tail && i === parts.length - 1 ? parseIpv4(part) : undefined;
      if (!v4) return undefined;
      out.push((v4[0] ?? 0) * 256 + (v4[1] ?? 0), (v4[2] ?? 0) * 256 + (v4[3] ?? 0));
    } else if (HEX_GROUP.test(part)) out.push(parseInt(part, 16));
    else return undefined;
  }
  return out;
}

function parseIpv6(text: string): number[] | undefined {
  if (!/^[0-9a-fA-F:.]+$/.test(text)) return undefined;
  const halves = text.split('::');
  if (halves.length > 2) return undefined;
  const compressed = halves.length === 2;
  const head = expandGroups(halves[0] ?? '', !compressed);
  const tail = compressed ? expandGroups(halves[1] ?? '', true) : [];
  if (!head || !tail) return undefined;
  const missing = 8 - head.length - tail.length;
  if (compressed ? missing < 1 : missing !== 0) return undefined;
  return [...head, ...Array<number>(compressed ? missing : 0).fill(0), ...tail];
}

/**
 * Truncates an address to its network prefix for logs and abuse signals: IPv4 to /24, IPv6 to /48.
 * IPv4-mapped IPv6 addresses are treated as IPv4. Output is canonical, so truncation is idempotent.
 */
export function truncateIp(ip: string): string {
  const v4 = parseIpv4(ip);
  if (v4) return `${v4[0]}.${v4[1]}.${v4[2]}.0`;
  const groups = parseIpv6(ip);
  if (!groups) throw validationError('PRIVACY.IP_INVALID', 'not an IPv4 or IPv6 address');
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = groups;
  if (g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff) return `${g6 >> 8}.${g6 & 255}.${g7 >> 8}.0`;
  return `${g0.toString(16)}:${g1.toString(16)}:${g2.toString(16)}::`;
}

/** Key tokens that identify an exact location or a direct contact detail. Matched per camelCase/snake_case word. */
const SENSITIVE_TOKENS: ReadonlySet<string> = new Set([
  'lat', 'lng', 'lon', 'latitude', 'longitude', 'coords', 'coordinates', 'gps', 'address', 'street', 'email', 'phone', 'telephone', 'mobile',
]);
const SENSITIVE_COMPOUNDS: ReadonlySet<string> = new Set(['exactlocation', 'homelocation', 'preciselocation']);
const MAX_DEPTH = 64;

const keyTokens = (key: string): string[] =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());

export const isSensitiveKey = (key: string): boolean =>
  keyTokens(key).some((t) => SENSITIVE_TOKENS.has(t)) || SENSITIVE_COMPOUNDS.has(key.replace(/[^A-Za-z0-9]/g, '').toLowerCase());

/** Paths of all sensitive keys at any depth, e.g. `items[0].homeAddress`. Values are never inspected or returned. */
export function findSensitiveKeys(value: unknown): string[] {
  const found: string[] = [];
  const seen = new WeakSet<object>();
  const walk = (node: unknown, path: string, depth: number): void => {
    if (node === null || typeof node !== 'object' || depth > MAX_DEPTH || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`, depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      const here = path === '' ? key : `${path}.${key}`;
      if (isSensitiveKey(key)) found.push(here);
      walk(child, here, depth + 1);
    }
  };
  walk(value, '', 0);
  return found;
}

/** Throws PRIVACY.SENSITIVE_KEY when any key at any depth names a coordinate, address or contact detail. */
export function assertNoSensitiveKeys(value: unknown): void {
  const paths = findSensitiveKeys(value);
  if (paths.length > 0) throw validationError('PRIVACY.SENSITIVE_KEY', 'payload contains location or contact keys', { paths: paths.slice(0, 20) });
}
