// Shared zod validators: UUIDv7, public (hour-floored) IDs, cid strings, RFC 3339 timestamps, code-point-bounded
// strings and the Money shape (CTR-ID-001, CTR-FED-001 FED-7, CTR-MNY-001, SCH-6).
import * as z from 'zod';
import { isHourFloored, isUuidV7, type Id } from '../ids/uuidv7.ts';

export { z };

/** Strict object: unknown keys are rejected (SCH-2). */
export const strictObject = z.strictObject;

export function uuidv7<T extends string = string>() {
  return z
    .string()
    .refine((v) => isUuidV7(v), { params: { code: 'INVALID_UUIDV7' } })
    .transform((v) => v as Id<T>);
}

/**
 * ID of a record that appears in a public projection (ID-8): a lowercase UUIDv7 (INVALID_UUIDV7) whose
 * embedded timestamp is a multiple of 3 600 000 ms (NOT_HOUR_FLOORED). The 24 h skew rule needs the receiver
 * clock: apply checkIdSkew, or use parsePublicId, where the ID is accepted.
 */
export function publicId<T extends string = string>() {
  return z
    .string()
    .refine((v) => isUuidV7(v), { params: { code: 'INVALID_UUIDV7' }, abort: true })
    .refine((v) => isHourFloored(v), { params: { code: 'NOT_HOUR_FLOORED' } })
    .transform((v) => v as Id<T>);
}

/** cid string form of CTR-FED-001 FED-7 (ID-9): `sha256-` plus 43 base64url characters without padding. */
export const CID_RE = /^sha256-[A-Za-z0-9_-]{43}$/;

/** Shape check only; the kernel never computes cids (F11.S01.M03 cidOf does) and never keys records by them. */
export function isCid(value: unknown): value is string {
  return typeof value === 'string' && CID_RE.test(value);
}

/** Field validator for a cid string (INVALID_CID otherwise). */
export function cid() {
  return z.string().refine((v) => isCid(v), { params: { code: 'INVALID_CID' } });
}

const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function isTimestamp(v: string): boolean {
  if (!TS_RE.test(v)) return false;
  const ms = Date.parse(v);
  return !Number.isNaN(ms) && new Date(ms).toISOString() === v;
}

/** RFC 3339 UTC timestamp with millisecond precision (ID-7). */
export function timestamp() {
  return z.string().refine(isTimestamp, { params: { code: 'INVALID_TIMESTAMP' } });
}

export function codePointLength(s: string): number {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

export interface BoundedStringOptions {
  readonly min?: number;
  readonly max: number;
}

/** String bounded in Unicode code points, not UTF-16 units (SCH-6). */
export function boundedString(opts: BoundedStringOptions) {
  const min = opts.min ?? 0;
  return z
    .string()
    .refine((v) => codePointLength(v) >= min, { params: { code: 'TOO_SMALL' }, abort: true })
    .refine((v) => codePointLength(v) <= opts.max, { params: { code: 'TOO_BIG' } });
}

export type MoneySign = 'any' | 'positive' | 'nonNegative';
const AMOUNT_RE = /^-?(0|[1-9][0-9]{0,77})$/;
const CURRENCY_RE = /^[A-Z][A-Z0-9]{2,9}$/;

function signOk(amount: string, sign: MoneySign): boolean {
  if (sign === 'any') return amount !== '-0';
  if (amount.startsWith('-')) return false;
  return sign === 'nonNegative' || amount !== '0';
}

/** Money = {amount: decimal integer string of minor units, currency: 3-10 uppercase} (MNY-1). */
export function money(opts: { readonly sign?: MoneySign } = {}) {
  const sign = opts.sign ?? 'any';
  return z.strictObject({
    amount: z
      .string()
      .refine((v) => AMOUNT_RE.test(v), { params: { code: 'INVALID_AMOUNT' }, abort: true })
      .refine((v) => signOk(v, sign), { params: { code: 'INVALID_SIGN' } }),
    currency: z.string().refine((v) => CURRENCY_RE.test(v), { params: { code: 'INVALID_CURRENCY' } }),
  });
}

/** Revision numbers start at 1 (CTR-ID-001 ID-4). */
export function revision() {
  return z.int().min(1);
}
