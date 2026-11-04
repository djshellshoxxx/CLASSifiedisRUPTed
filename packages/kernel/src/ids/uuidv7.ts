// UUIDv7 identifiers (RFC 9562 §5.7) with a monotonic counter (§6.2 method 1) — CTR-ID-001 ID-1/ID-2.
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';

declare const idBrand: unique symbol;
/** Branded identifier: IDs of different entity kinds are not interchangeable (ID-2). */
export type Id<T extends string = string> = string & { readonly [idBrand]: T };

export interface IdGen {
  next<T extends string = string>(): Id<T>;
}

export type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => void;

export const MAX_ID_SKEW_MS = 24 * 60 * 60 * 1000;
const UUIDV7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const COUNTER_BITS = 42;
const COUNTER_MAX = 2 ** COUNTER_BITS - 1;
const TWO_30 = 2 ** 30;

export function webCryptoRandom(bytes: Uint8Array<ArrayBuffer>): void {
  globalThis.crypto.getRandomValues(bytes);
}

export function isUuidV7(value: unknown): value is Id {
  return typeof value === 'string' && UUIDV7_RE.test(value);
}

/** Milliseconds since the epoch embedded in a UUIDv7. */
export function uuidV7Timestamp(id: string): number {
  const hex = id.slice(0, 8) + id.slice(9, 13);
  return Number.parseInt(hex, 16);
}

export function parseId<T extends string = string>(value: unknown, path = 'id'): Result<Id<T>, AppError> {
  if (isUuidV7(value)) return ok(value as Id<T>);
  return err(appError('VALIDATION_FAILED', { fields: [{ path, code: 'INVALID_UUIDV7' }] }));
}

/** Rejects IDs whose embedded timestamp is more than 24 h ahead of the receiver's clock (ID-1). */
export function checkIdSkew<T extends string>(id: Id<T>, nowMs: number, maxSkewMs = MAX_ID_SKEW_MS): Result<Id<T>, AppError> {
  const ts = uuidV7Timestamp(id);
  if (ts - nowMs > maxSkewMs) return err(appError('ID_TIMESTAMP_SKEW', { params: { maxSkewMs } }));
  return ok(id);
}

function hex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(16, 20)}-${out.slice(20)}`;
}

/** Encodes timestamp, 42-bit counter (12 bits rand_a + 30 high bits of rand_b) and 32 random bits. */
export function encodeUuidV7(ms: number, counter: number, tail: Uint8Array): string {
  const b = new Uint8Array(16);
  let t = ms;
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  const hi12 = Math.floor(counter / TWO_30);
  const lo30 = counter % TWO_30;
  b[6] = 0x70 | (hi12 >>> 8);
  b[7] = hi12 & 0xff;
  b[8] = 0x80 | ((lo30 >>> 24) & 0x3f);
  b[9] = (lo30 >>> 16) & 0xff;
  b[10] = (lo30 >>> 8) & 0xff;
  b[11] = lo30 & 0xff;
  b.set(tail.subarray(0, 4), 12);
  return hex(b);
}

function randomCounterSeed(fill: RandomFill): number {
  const r = new Uint8Array(6);
  fill(r);
  // 41 random bits; the counter's top bit starts at zero to leave room for increments (RFC 9562 §6.2).
  const high = (r[0] ?? 0) & 0x01;
  return high * 2 ** 40 + (r[1] ?? 0) * 2 ** 32 + (((r[2] ?? 0) << 24) >>> 0) + ((r[3] ?? 0) << 16) + ((r[4] ?? 0) << 8) + (r[5] ?? 0);
}

export interface UuidV7Options {
  readonly now?: () => number;
  readonly random?: RandomFill;
}

/**
 * Monotonic UUIDv7 generator. Within one millisecond the counter increments; on counter overflow
 * or a clock that moves backwards the embedded timestamp is advanced past the last one used.
 */
export function createUuidV7Generator(opts: UuidV7Options = {}): IdGen {
  const now = opts.now ?? (() => Date.now());
  const fill = opts.random ?? webCryptoRandom;
  let lastMs = -1;
  let counter = 0;
  const tail = new Uint8Array(4);
  return {
    next<T extends string = string>(): Id<T> {
      const ms = now();
      if (ms > lastMs) {
        lastMs = ms;
        counter = randomCounterSeed(fill);
      } else if (counter >= COUNTER_MAX) {
        lastMs += 1;
        counter = randomCounterSeed(fill);
      } else {
        counter += 1;
      }
      fill(tail);
      return encodeUuidV7(lastMs, counter, tail) as Id<T>;
    },
  };
}

/** Seeded xorshift32 byte source for deterministic tests (CTR-TST-001 TST-3). */
export function createSeededRandom(seed: number): RandomFill {
  let s = seed >>> 0 || 0x9e3779b9;
  return (bytes) => {
    for (let i = 0; i < bytes.length; i++) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      bytes[i] = s & 0xff;
    }
  };
}

/** Deterministic UUIDv7 generator: same seed and clock produce the same sequence. */
export function createDeterministicIds(opts: { readonly seed?: number; readonly now: () => number }): IdGen {
  return createUuidV7Generator({ now: opts.now, random: createSeededRandom(opts.seed ?? 1) });
}
