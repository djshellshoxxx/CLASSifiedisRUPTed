/**
 * CTR-ID-001: stable identifiers. Decision (ADR-0002): ULID (Crockford base32, 26 chars),
 * monotonic within a millisecond, with a type prefix: `lst_01J...`.
 * Prefixes make IDs self-describing in logs without revealing content.
 */
import type { Clock } from './clock';
import { validationError } from './errors';

declare const brand: unique symbol;
export type Id<K extends string> = string & { readonly [brand]: K };

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const PREFIX_RE = /^[a-z][a-z0-9]{1,11}$/;

export type RandomSource = (bytes: number) => Uint8Array;

export const cryptoRandom: RandomSource = (n) => {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
};

/** Deterministic PRNG (xorshift32) for tests only. Never use for keys or tokens. */
export const seededRandom = (seed: number): RandomSource => {
  let s = seed >>> 0 || 1;
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      out[i] = s & 0xff;
    }
    return out;
  };
};

export interface IdGenerator {
  /** New ULID without prefix. */
  ulid(): string;
  /** New prefixed id, e.g. next('lst') -> 'lst_01J...'. */
  next<K extends string>(prefix: string): Id<K>;
}

function encodeTime(ms: number): string {
  if (!Number.isSafeInteger(ms) || ms < 0 || ms > 2 ** 48 - 1) throw new RangeError('time out of ULID range');
  let out = '';
  let t = ms;
  for (let i = 0; i < 10; i++) {
    out = ALPHABET[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

/** 80 random bits as 16 base32 chars, held as 16 5-bit digits for monotonic increment. */
function randomDigits(random: RandomSource): number[] {
  const bytes = random(10);
  const digits: number[] = [];
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      digits.push((acc >> bits) & 31);
    }
    acc &= (1 << bits) - 1;
  }
  return digits;
}

export function createIdGenerator(clock: Clock, random: RandomSource = cryptoRandom): IdGenerator {
  let lastTime = -1;
  let last: number[] = [];
  const ulid = (): string => {
    const now = clock.now();
    if (now <= lastTime) {
      // Monotonic: increment previous randomness so ids stay sortable within one ms or a stalled clock.
      let i = last.length - 1;
      while (i >= 0 && last[i] === 31) {
        last[i] = 0;
        i--;
      }
      if (i < 0) throw new RangeError('ULID randomness overflow');
      last[i] = (last[i] as number) + 1;
    } else {
      lastTime = now;
      last = randomDigits(random);
    }
    return encodeTime(lastTime) + last.map((d) => ALPHABET[d]).join('');
  };
  return {
    ulid,
    next<K extends string>(prefix: string): Id<K> {
      if (!PREFIX_RE.test(prefix)) throw new TypeError(`invalid id prefix: ${prefix}`);
      return `${prefix}_${ulid()}` as Id<K>;
    },
  };
}

export function isId(value: unknown, prefix?: string): boolean {
  if (typeof value !== 'string') return false;
  const sep = value.indexOf('_');
  if (sep < 0) return false;
  const p = value.slice(0, sep);
  const u = value.slice(sep + 1);
  return PREFIX_RE.test(p) && ULID_RE.test(u) && (prefix === undefined || p === prefix);
}

export function parseId<K extends string>(value: unknown, prefix: string): Id<K> {
  if (!isId(value, prefix)) throw validationError('ID.INVALID', `expected ${prefix} id`, { prefix });
  return value as Id<K>;
}

/** Millisecond timestamp encoded in a ULID-based id. */
export function idTime(id: string): number {
  const u = id.slice(id.indexOf('_') + 1, id.indexOf('_') + 11);
  let t = 0;
  for (const c of u) t = t * 32 + ALPHABET.indexOf(c);
  return t;
}
