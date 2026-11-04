// Log redaction (CTR-OBS-001 OBS-1, CTR-PRV-001): drop sensitive keys at any depth, truncate IPs.
import { truncateIp } from './ip.ts';

const DROP_KEYS = new Set([
  'token', 'secret', 'password', 'privatekey', 'recoverycode', 'email', 'address', 'lat', 'lon', 'note', 'body', 'ciphertext',
  'authorization', 'cookie', 'setcookie', 'passphrase', 'apikey', 'latitude', 'longitude', 'lng', 'plaintext',
]);
const DROP_SUFFIXES = ['token', 'secret', 'password', 'privatekey', 'recoverycode', 'email', 'ciphertext', 'passphrase'];
const IP_KEYS = new Set(['ip', 'ipaddress', 'remoteaddress', 'clientip', 'remoteip', 'forwardedfor', 'xforwardedfor', 'xrealip']);
const MAX_DEPTH = 8;
const MAX_STRING = 2048;
export const REDACTED = '[redacted]';

function norm(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, '');
}

export function isDroppedKey(key: string): boolean {
  const n = norm(key);
  return DROP_KEYS.has(n) || DROP_SUFFIXES.some((s) => n.endsWith(s));
}

export function isIpKey(key: string): boolean {
  return IP_KEYS.has(norm(key));
}

function redactString(s: string): string {
  const ip = truncateIp(s.trim());
  if (ip) return ip;
  return s.length > MAX_STRING ? `${s.slice(0, MAX_STRING)}…` : s;
}

function redactIpValue(v: unknown): unknown {
  if (typeof v !== 'string') return REDACTED;
  const parts = v.split(',').map((p) => truncateIp(p.trim()) ?? REDACTED);
  return parts.join(', ');
}

function redactError(e: Error, seen: WeakSet<object>, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = { name: e.name, message: redactString(e.message) };
  const code = (e as { code?: unknown }).code;
  if (typeof code === 'string') out['code'] = code;
  if (e.stack) out['stack'] = e.stack.split('\n').slice(0, 8).join('\n');
  if (e.cause !== undefined) out['cause'] = walk(e.cause, seen, depth + 1);
  return out;
}

function walkObject(o: object, seen: WeakSet<object>, depth: number): unknown {
  if (seen.has(o)) return '[circular]';
  seen.add(o);
  if (o instanceof Error) return redactError(o, seen, depth);
  if (Array.isArray(o)) return o.map((v) => walk(v, seen, depth + 1));
  if (o instanceof Date) return o.toISOString();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (isIpKey(k)) out[k] = redactIpValue(v);
    else if (!isDroppedKey(k)) out[k] = walk(v, seen, depth + 1);
  }
  return out;
}

function walk(v: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (depth > MAX_DEPTH) return '[depth]';
  switch (typeof v) {
    case 'string':
      return redactString(v);
    case 'bigint':
      return v.toString();
    case 'function':
    case 'symbol':
      return undefined;
    case 'object':
      return v === null ? null : walkObject(v, seen, depth);
    default:
      return v;
  }
}

/** Returns a redacted deep copy safe for logs. */
export function redact(value: unknown): unknown {
  return walk(value, new WeakSet(), 0);
}
