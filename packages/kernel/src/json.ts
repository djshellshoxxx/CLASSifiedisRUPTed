/**
 * JSON helpers.
 * - `canonicalize`: RFC 8785 (JCS) compatible serialization of plain JSON values.
 *   Used for signatures and idempotency fingerprints. Rejects bigint, undefined in arrays,
 *   non-finite numbers, and non-plain objects so that two parties always agree on bytes.
 * - `toJsonSafe` / `fromJsonSafe`: lossless encoding of bigint as `{"$bigint":"<decimal>"}`
 *   for storage and transport.
 */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

function isPlainObject(v: object): boolean {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) throw new TypeError('canonicalize: non-finite number');
      return JSON.stringify(value);
    case 'string':
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value
          .map((v) => {
            if (v === undefined) throw new TypeError('canonicalize: undefined in array');
            return canonicalize(v);
          })
          .join(',')}]`;
      }
      if (!isPlainObject(value)) throw new TypeError('canonicalize: non-plain object');
      const obj = value as Record<string, unknown>;
      // JCS sorts by UTF-16 code units, which is JS default string comparison.
      const keys = Object.keys(obj)
        .filter((k) => obj[k] !== undefined)
        .sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
    }
    default:
      throw new TypeError(`canonicalize: unsupported type ${typeof value}`);
  }
}

export function toJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return { $bigint: value.toString() };
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (value instanceof Uint8Array) throw new TypeError('toJsonSafe: encode bytes explicitly (base64url)');
  if (typeof value === 'object') {
    const out: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = toJsonSafe(v);
    }
    return out;
  }
  throw new TypeError(`toJsonSafe: unsupported type ${typeof value}`);
}

export function fromJsonSafe<T = unknown>(value: JsonValue): T {
  if (Array.isArray(value)) return value.map((v) => fromJsonSafe(v)) as T;
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === '$bigint' && typeof value.$bigint === 'string' && /^-?\d+$/.test(value.$bigint)) {
      return BigInt(value.$bigint) as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = fromJsonSafe(v);
    return out as T;
  }
  return value as T;
}

export const encodeJson = (value: unknown): string => JSON.stringify(toJsonSafe(value));
export const decodeJson = <T = unknown>(text: string): T => fromJsonSafe<T>(JSON.parse(text) as JsonValue);

/** Stable fingerprint text for idempotency comparison (bigint-safe). */
export const fingerprint = (value: unknown): string => canonicalize(toJsonSafe(value));

/** Deep-freeze plain data to stop aliasing bugs between store and callers. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}
