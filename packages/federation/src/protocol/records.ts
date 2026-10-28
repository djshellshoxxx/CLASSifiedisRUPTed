/**
 * F11.S01.M02 records: envelope v1 schema, per-type payload schemas and the privacy assertions every
 * federated payload must satisfy (public fields only, region cells of at most 5 characters, no coordinate,
 * address or contact keys at any depth). Validation never echoes payload values.
 */
import type { Result } from '@classrup/kernel';
import { CELL_RE, canonicalize, err, ok, PUBLIC_CELL_PRECISION, schemas, toJsonSafe, z } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import type { FederatedEnvelope, FederatedRecord, RecordType } from '../types';
import { RECORD_TYPES } from '../types';
import { MAX_RECORD_BYTES } from '../support';

export type RejectReason =
  | 'malformed'
  | 'too_large'
  | 'privacy_violation'
  | 'invalid_payload'
  | 'origin_mismatch'
  | 'future_dated'
  | 'blocked_peer'
  | 'blocked_domain'
  | 'blocked_author'
  | 'bad_author_signature'
  | 'bad_relay_signature'
  | 'author_key_mismatch'
  | 'stale_revision'
  | 'tombstoned';

export const relayIdSchema = z
  .string()
  .max(253)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?$/);
export const keyIdSchema = z.string().regex(/^ed25519:[A-Za-z0-9_-]{43}$/);
export const signatureSchema = z.string().regex(/^[A-Za-z0-9_-]{86}$/);
export const hashSchema = z.string().regex(/^sha256:[A-Za-z0-9_-]{43}$/);
const recordIdSchema = z.string().regex(/^[A-Za-z0-9_.:-]{8,80}$/);

const recordSchema = z.strictObject({
  v: z.literal(1),
  type: z.enum(RECORD_TYPES),
  recordId: recordIdSchema,
  revision: z.number().int().min(1).max(1_000_000),
  authorKeyId: keyIdSchema,
  originRelay: relayIdSchema,
  createdAt: schemas.timestamp(),
  payload: z.record(z.string(), z.unknown()),
  prevHash: hashSchema.optional(),
});

export const envelopeSchema = z.strictObject({
  record: recordSchema,
  authorSig: signatureSchema,
  relayKeyId: keyIdSchema.optional(),
  relaySig: signatureSchema.optional(),
});

export const migrationProofSchema = z.strictObject({
  statement: z.strictObject({ fromRelay: relayIdSchema, toRelay: relayIdSchema, oldKeyId: keyIdSchema, newKeyId: keyIdSchema, at: schemas.timestamp() }),
  oldSig: signatureSchema,
  newSig: signatureSchema,
});

const cellSchema = z
  .string()
  .regex(CELL_RE)
  .refine((c) => c.length <= PUBLIC_CELL_PRECISION, 'region cell too precise');
const slug = z.string().regex(/^[a-z0-9][a-z0-9_.-]{0,63}$/);
const text = (min: number, max: number) => schemas.text(min, max);

const listingPayload = z.strictObject({
  title: text(1, 140),
  description: text(0, 2000).optional(),
  category: slug,
  kind: z.enum(['sell', 'wanted', 'giveaway', 'barter', 'service', 'rental', 'auction']),
  price: z.strictObject({ currency: schemas.currency(), minor: z.string().regex(/^-?\d{1,30}$/) }).optional(),
  acceptsBarter: z.boolean(),
  regionCell: cellSchema.optional(),
  quantityAvailable: z.number().int().min(0).max(1_000_000),
  expiresAt: schemas.timestamp().optional(),
});

const profilePayload = z.strictObject({ pseudonym: text(2, 40), bio: text(0, 500).optional(), regionCell: cellSchema.optional() });

const tombstonePayload = z.strictObject({
  reason: z.enum(['deleted', 'expired', 'moderated', 'unfederated', 'migrated']),
  redirect: z.strictObject({ toRelay: relayIdSchema, newKeyId: keyIdSchema }).optional(),
  migration: migrationProofSchema.optional(),
});

const labelPayload = z.strictObject({
  targetRecordId: recordIdSchema,
  label: z.enum(['spam', 'scam', 'prohibited', 'misleading', 'duplicate', 'unsafe']),
  severity: z.enum(['info', 'warn', 'block']),
  note: text(0, 280).optional(),
});

const PAYLOAD_SCHEMAS: Readonly<Record<RecordType, z.ZodType>> = {
  'listing.public': listingPayload,
  'profile.public': profilePayload,
  tombstone: tombstonePayload,
  'moderation.label': labelPayload,
};

/** Key names that can carry exact location or contact data, compared case-insensitively without separators. */
const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  'lat', 'lng', 'lon', 'long', 'latitude', 'longitude', 'coords', 'coordinates', 'gps', 'address', 'street', 'streetaddress', 'postcode', 'zip', 'zipcode',
  'email', 'emailaddress', 'phone', 'phonenumber', 'tel', 'mobile',
]);
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const COORDINATE_PAIR_RE = /-?\d{1,3}\.\d{3,}\s*[,;/ ]\s*-?\d{1,3}\.\d{3,}/;
const GEO_URI_RE = /\bgeo:/i;
const MAX_DEPTH = 8;
const MAX_NODES = 2000;

export type PrivacyFinding = 'forbidden_key' | 'coordinates_in_value' | 'email_in_value' | 'too_complex';

/** Walks the payload iteratively (no recursion bombs) and reports the first privacy finding, never the offending value. */
export function scanPrivacy(payload: unknown): PrivacyFinding | undefined {
  const stack: { value: unknown; depth: number }[] = [{ value: payload, depth: 0 }];
  let nodes = 0;
  while (stack.length > 0) {
    const { value, depth } = stack.pop() as { value: unknown; depth: number };
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) return 'too_complex';
    if (typeof value === 'string') {
      if (EMAIL_RE.test(value)) return 'email_in_value';
      if (COORDINATE_PAIR_RE.test(value) || GEO_URI_RE.test(value)) return 'coordinates_in_value';
    } else if (Array.isArray(value)) {
      for (const v of value) stack.push({ value: v, depth: depth + 1 });
    } else if (value !== null && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        if (FORBIDDEN_KEYS.has(k.toLowerCase().replace(/[^a-z0-9]/g, ''))) return 'forbidden_key';
        stack.push({ value: v, depth: depth + 1 });
      }
    }
  }
  return undefined;
}

export const byteLength = (text: string): number => new TextEncoder().encode(text).length;

/** Canonical size of the signed part of an envelope. Unserialisable input counts as malformed by the caller. */
export function recordBytes(record: unknown): number {
  return byteLength(canonicalize(toJsonSafe(record)));
}

export const hashRecord = (record: FederatedRecord): string => contentHash(record);

/** Structure, size and payload privacy checks (signatures are checked separately). */
export function validateEnvelope(input: unknown): Result<FederatedEnvelope, RejectReason> {
  let size: number;
  try {
    size = byteLength(JSON.stringify(input));
  } catch {
    return err('malformed');
  }
  if (size > MAX_RECORD_BYTES * 2) return err('too_large');
  const parsed = envelopeSchema.safeParse(input);
  if (!parsed.success) return err('malformed');
  const envelope = parsed.data as FederatedEnvelope;
  if (recordBytes(envelope.record) > MAX_RECORD_BYTES) return err('too_large');
  if (scanPrivacy(envelope.record.payload) !== undefined) return err('privacy_violation');
  const payload = PAYLOAD_SCHEMAS[envelope.record.type].safeParse(envelope.record.payload);
  if (!payload.success) return err('invalid_payload');
  return ok(envelope);
}

