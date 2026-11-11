// Log and error redaction (T01): a deny-list of key names plus a pattern scanner that removes 43-character
// base64url and 64-character hex runs labelled by a deny-listed key, applied before any log line is emitted.
import type { Counter, LogSink } from '@classrup/kernel';
import { REDACTED } from './schema.ts';
import { Secret } from './secret.ts';

const SUFFIXES = ['token', 'secret', 'password', 'passwd', 'pepper', 'privatekey', 'apikey', 'datakey', 'signingkey', 'secretkey', 'accesskey', 'passphrase', 'credential', 'credentials'];
const EXACT = new Set(['authorization', 'cookie', 'setcookie', 'bearer', 'pwd']);
const MAX_DEPTH = 8;

function norm(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** True for key names whose values are secrets (token, *_password, audit_pepper, RELAY_SECRET_*, …). */
export function isSecretKeyName(key: string): boolean {
  const n = norm(key);
  if (n.length === 0) return false;
  return EXACT.has(n) || n.startsWith('relaysecret') || SUFFIXES.some((s) => n.endsWith(s));
}

// label, separator (quote/colon/equals or whitespace), then a 43-char base64url run or a 64-char hex run.
const LABELLED_RUN = /([A-Za-z][A-Za-z0-9_.-]{0,63})(["']?[ \t]*[:=][ \t]*["']?|["']?[ \t]+)([A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])|[0-9a-fA-F]{64}(?![0-9a-fA-F]))/g;

export interface ScanResult {
  readonly text: string;
  readonly redactions: number;
}

/** Replaces every labelled secret-like run in free text with [REDACTED]. */
export function scanText(text: string): ScanResult {
  let redactions = 0;
  const out = text.replace(LABELLED_RUN, (match: string, label: string, sep: string) => {
    if (!isSecretKeyName(label)) return match;
    redactions += 1;
    return `${label}${sep}${REDACTED}`;
  });
  return { text: out, redactions };
}

interface Walk {
  count: number;
  readonly seen: WeakSet<object>;
}

function walkError(e: Error, w: Walk, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = { name: e.name, message: walk(e.message, w, depth + 1) };
  if (e.stack) out['stack'] = walk(e.stack, w, depth + 1);
  if (e.cause !== undefined) out['cause'] = walk(e.cause, w, depth + 1);
  return out;
}

function walkObject(o: object, w: Walk, depth: number): unknown {
  if (Secret.isSecret(o)) {
    w.count += 1;
    return REDACTED;
  }
  if (w.seen.has(o)) return '[circular]';
  w.seen.add(o);
  if (o instanceof Error) return walkError(o, w, depth);
  if (o instanceof Uint8Array) return `[${o.length} bytes]`;
  if (Array.isArray(o)) return o.map((v) => walk(v, w, depth + 1));
  if (o instanceof Date) return o.toISOString();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (isSecretKeyName(k) && v !== undefined && v !== null) {
      w.count += 1;
      out[k] = REDACTED;
    } else out[k] = walk(v, w, depth + 1);
  }
  return out;
}

function walk(v: unknown, w: Walk, depth: number): unknown {
  if (depth > MAX_DEPTH) return '[depth]';
  switch (typeof v) {
    case 'string': {
      const s = scanText(v);
      w.count += s.redactions;
      return s.text;
    }
    case 'bigint':
      return v.toString();
    case 'function':
    case 'symbol':
      return undefined;
    case 'object':
      return v === null ? null : walkObject(v, w, depth);
    default:
      return v;
  }
}

/** Redacted deep copy plus the number of values removed. */
export function redactWithCount(value: unknown): { readonly value: unknown; readonly redactions: number } {
  const w: Walk = { count: 0, seen: new WeakSet() };
  const out = walk(value, w, 0);
  return { value: out, redactions: w.count };
}

/** Redacted deep copy: Secret values, deny-listed keys and labelled secret runs become [REDACTED]. */
export function redact(value: unknown): unknown {
  return redactWithCount(value).value;
}

/**
 * Log sink wrapper applying the pattern scanner to every formatted line before it reaches the real sink,
 * counting redactions on classrup_security_log_redactions_total when a counter is given.
 */
export function createRedactingSink(sink: LogSink, opts: { readonly redactions?: Counter } = {}): LogSink {
  return (line) => {
    const s = scanText(line);
    if (s.redactions > 0) opts.redactions?.inc({}, s.redactions);
    sink(s.text);
  };
}
