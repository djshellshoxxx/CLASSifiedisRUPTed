// Canonical JSON (RFC 8785 JCS ordering for JSON values) and SHA-256 via WebCrypto (isomorphic).
function canon(value: unknown, inArray: boolean): string | undefined {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw new TypeError('canonicalJson: non-finite number');
      return JSON.stringify(value);
    case 'undefined':
    case 'function':
    case 'symbol':
      return inArray ? 'null' : undefined;
    case 'bigint':
      throw new TypeError('canonicalJson: bigint must be encoded as a string');
    default:
      return canonObject(value as object);
  }
}

function canonObject(value: object): string {
  if (Array.isArray(value)) return `[${value.map((v) => canon(v, true)).join(',')}]`;
  const maybe = value as { toJSON?: () => unknown };
  if (typeof maybe.toJSON === 'function') return canon(maybe.toJSON(), false) ?? 'null';
  const keys = Object.keys(value).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = canon((value as Record<string, unknown>)[k], false);
    if (v !== undefined) parts.push(`${JSON.stringify(k)}:${v}`);
  }
  return `{${parts.join(',')}}`;
}

/** Deterministic JSON: object keys sorted by UTF-16 code units, no whitespace (JCS for JSON values). */
export function canonicalJson(value: unknown): string {
  return canon(value, false) ?? 'null';
}

const encoder = new TextEncoder();

export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text));
  let out = '';
  for (const b of new Uint8Array(digest)) out += b.toString(16).padStart(2, '0');
  return out;
}

/** Idempotency request hash (CTR-IDM-001 IDM-1): SHA-256 of canonical JSON of the raw input. */
export function requestHash(input: unknown): Promise<string> {
  return sha256Hex(canonicalJson(input));
}

/** Normalizes a value to what JSON storage returns (drops undefined, converts Dates via toJSON). */
export function jsonNormalize<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/** UTF-8 byte-order comparison, equal to SQLite BINARY collation for TEXT. */
export function compareUtf8(a: string, b: string): number {
  if (a === b) return 0;
  const ea = encoder.encode(a);
  const eb = encoder.encode(b);
  const n = Math.min(ea.length, eb.length);
  for (let i = 0; i < n; i++) {
    const d = (ea[i] ?? 0) - (eb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return ea.length === eb.length ? 0 : ea.length < eb.length ? -1 : 1;
}
