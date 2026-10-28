/** Shared input schemas and reference-id rules for the comms area. */
import { schemas, validationError, z } from '@classrup/kernel';

export const accountIdSchema = z.string().min(1).max(64);
export const threadIdSchema = schemas.id('thr');
export const hashSchema = z.string().regex(/^sha256:[A-Za-z0-9_-]{43}$/, 'expected sha256:<base64url>');

/** Which id prefixes may stand for each referenced record type (see docs/ID_PREFIXES.md). */
const REF_PREFIXES: Readonly<Record<string, readonly string[]>> = {
  listing: ['lst'],
  offer: ['ofr', 'neg'],
  proposal: ['trd', 'trev'],
  trade: ['trd'],
  cycle: ['cyc'],
  booking: ['bkg', 'rbk'],
  rental: ['rnt', 'rbk'],
  auction: ['auc'],
  meetup: ['mtp'],
};

export const REF_TYPES = Object.keys(REF_PREFIXES) as [string, ...string[]];

const REF_ID_RE = /^([a-z][a-z0-9]{1,11})_[0-9A-HJKMNP-TV-Z]{26}$/;

export function assertRefId(type: string, id: string): void {
  const prefix = REF_ID_RE.exec(id)?.[1];
  if (prefix === undefined || !(REF_PREFIXES[type] ?? []).includes(prefix)) {
    throw validationError('COMMS.REF_INVALID', 'reference id does not match its type', { type });
  }
}

const b64 = (min: number, max: number) => z.string().regex(/^[A-Za-z0-9_-]+$/).min(min).max(max);

/** 64 KiB of ciphertext is 87382 base64url characters. */
export const MAX_CIPHERTEXT_BYTES = 64 * 1024;
const MAX_CIPHERTEXT_CHARS = Math.ceil((MAX_CIPHERTEXT_BYTES * 4) / 3);

const boxKeyIdSchema = z.string().regex(/^x25519:[A-Za-z0-9_-]{43}$/);

const sealedSchema = z.strictObject({ v: z.literal(1), epk: b64(43, 43), nonce: b64(32, 32), ct: b64(1, 200) });

export const ciphertextSchema = z.strictObject({
  v: z.literal(1),
  nonce: b64(32, 32),
  ct: b64(1, MAX_CIPHERTEXT_CHARS),
  keys: z.record(boxKeyIdSchema, sealedSchema),
});
