// F16.S02.M03 validation rules V01–V11 as pure functions returning Result values.
import { appError, err, ok, type AppError, type Result } from '@classrup/kernel';
import { signatureErrors } from './errors.ts';
import { envelopeContext, MAX_PAYLOAD_BYTES, payloadSchemaFor, type InventoryEntry } from './inventory.ts';
import { checkJsonValue, jcs, jcsBytes, parseStrictJson } from './primitives/jcs.ts';
import { sha256Cid } from './primitives/ed25519.ts';
import { fromBase64url, utf8 } from './primitives/encoding.ts';
import type { FreshnessClass, KeyHandle, KeyStatusInput, KeyStatusSource, ReportedKeyStatus } from './schema.ts';

const PAYLOAD_LIMITS = { allowFloats: false, maxDepth: 32 } as const;

function code(c: keyof typeof signatureErrors.codes, params?: Readonly<Record<string, unknown>>): AppError {
  return signatureErrors.make(c, params ? { params } : undefined);
}

export function maxPayloadBytes(entry: InventoryEntry | undefined): number {
  return Math.min(MAX_PAYLOAD_BYTES, entry?.maxBytes ?? MAX_PAYLOAD_BYTES);
}

/** V01: payload at most 65536 bytes of canonical JSON, or the context's smaller maximum. */
export function checkPayloadSize(size: number, entry: InventoryEntry | undefined): Result<void, AppError> {
  const limit = maxPayloadBytes(entry);
  return size <= limit ? ok(undefined) : err(appError('PAYLOAD_TOO_LARGE', { params: { limitBytes: limit } }));
}

/** V08: envelope version 1 only. */
export function checkVersion(v: unknown): Result<void, AppError> {
  return v === 1 ? ok(undefined) : err(appError('UNSUPPORTED_SCHEMA_VERSION', { params: { v: typeof v === 'number' ? v : null } }));
}

/** V09: alg ed25519 and a 64-byte base64url signature. */
export function checkAlgorithm(alg: unknown, sig: unknown): Result<Uint8Array, AppError> {
  if (alg !== 'ed25519') return err(code('SECURITY_SIGNATURE_INVALID', { reason: 'algorithm' }));
  const bytes = typeof sig === 'string' ? fromBase64url(sig) : undefined;
  return bytes && bytes.length === 64 ? ok(bytes) : err(code('SECURITY_SIGNATURE_INVALID', { reason: 'encoding' }));
}

/** V02 (first half): the context is an envelope context of the inventory. */
export function checkContextKnown(ctx: unknown): Result<InventoryEntry, AppError> {
  const entry = typeof ctx === 'string' ? envelopeContext(ctx) : undefined;
  return entry ? ok(entry) : err(code('SECURITY_CONTEXT_MISMATCH', { reason: 'not_in_inventory' }));
}

/** V02 (second half): the context equals the caller's expected context. */
export function checkContextExpected(ctx: string, expected: unknown): Result<void, AppError> {
  return ctx === expected ? ok(undefined) : err(code('SECURITY_CONTEXT_MISMATCH', { reason: 'unexpected_context' }));
}

export interface CanonicalPayload {
  readonly value: unknown;
  readonly bytes: Uint8Array;
}

/**
 * V01 + V03: a payload object is checked for plain JSON without floats or lone surrogates; a payload given
 * as transmitted text is parsed strictly (duplicate keys refused) and must equal its RFC 8785 form.
 */
export function canonicalPayload(payload: unknown, entry: InventoryEntry | undefined): Result<CanonicalPayload, AppError> {
  const limit = maxPayloadBytes(entry);
  const notCanonical = (reason: string) => err(code('SECURITY_PAYLOAD_NOT_CANONICAL', { reason }));
  if (typeof payload === 'string') {
    const size = checkPayloadSize(utf8(payload).length, entry);
    if (!size.ok) return size;
    const parsed = parseStrictJson(payload, PAYLOAD_LIMITS);
    if (!parsed.ok) return notCanonical(parsed.error);
    const text = jcs(parsed.value, PAYLOAD_LIMITS);
    if (!text.ok) return notCanonical(text.error);
    if (text.value !== payload) return notCanonical('not_canonical_form');
    return ok({ value: parsed.value, bytes: utf8(text.value) });
  }
  const issue = checkJsonValue(payload, PAYLOAD_LIMITS);
  if (issue) return notCanonical(issue);
  const bytes = jcsBytes(payload, { ...PAYLOAD_LIMITS, maxBytes: limit });
  if (!bytes.ok) return bytes.error === 'TOO_LARGE' ? err(appError('PAYLOAD_TOO_LARGE', { params: { limitBytes: limit } })) : notCanonical(bytes.error);
  return ok({ value: payload, bytes: bytes.value });
}

/** payloadHash = sha256-<base64url> of SHA-256 over the JCS bytes of the payload. */
export function payloadHashOfBytes(bytes: Uint8Array): string {
  return sha256Cid(bytes);
}

/** V10: the payload's JCS hash equals payloadHash. */
export function checkPayloadHash(bytes: Uint8Array | undefined, payloadHash: string): Result<void, AppError> {
  if (!bytes) return err(code('SECURITY_PAYLOAD_HASH_MISMATCH', { reason: 'payload_missing' }));
  return payloadHashOfBytes(bytes) === payloadHash ? ok(undefined) : err(code('SECURITY_PAYLOAD_HASH_MISMATCH', { reason: 'hash_differs' }));
}

function sameJson(a: unknown, b: unknown): boolean {
  const ja = jcs(a);
  const jb = jcs(b);
  return ja.ok && jb.ok && ja.value === jb.value;
}

/** V06: every binding field of a revision-bound context equals the caller's expected value. */
export function checkBinding(entry: InventoryEntry, payload: unknown, expected: Readonly<Record<string, unknown>> | undefined): Result<void, AppError> {
  if (entry.binding.length === 0) return ok(undefined);
  if (expected === undefined || typeof payload !== 'object' || payload === null) return err(code('SECURITY_BINDING_MISMATCH', { reason: 'binding_missing' }));
  for (const field of entry.binding) {
    if (!Object.hasOwn(expected, field)) return err(code('SECURITY_BINDING_MISMATCH', { field, reason: 'expectation_missing' }));
    if (!sameJson((payload as Record<string, unknown>)[field], expected[field])) return err(code('SECURITY_BINDING_MISMATCH', { field }));
  }
  return ok(undefined);
}

const KNOWN_STATUS: ReadonlySet<string> = new Set(['active', 'revocation_pending', 'contested', 'revoked', 'expired', 'unknown']);

function normalizeStatus(status: unknown): ReportedKeyStatus {
  if (status === 'pending') return 'revocation_pending';
  if (typeof status === 'string' && KNOWN_STATUS.has(status)) return status as ReportedKeyStatus;
  // Unknown future statuses fail closed (migration rule: treat unknown statuses as revoked).
  return typeof status === 'string' ? 'revoked' : 'unknown';
}

function normalizeFreshness(f: unknown): FreshnessClass {
  return f === 'fresh' || f === 'stale' ? f : 'unknown';
}

export interface EvaluatedStatus {
  readonly status: ReportedKeyStatus;
  readonly finalListed: boolean;
  readonly freshnessClass: FreshnessClass;
}

/**
 * Reads the caller-supplied key status. A missing, throwing, malformed or too old status is unknown and
 * can never lead to acceptance; freshness is passed through and never upgraded.
 */
export function readKeyStatus(source: KeyStatusSource, opts: { readonly now?: string; readonly maxStatusAgeMs?: number } = {}): EvaluatedStatus {
  const unknown: EvaluatedStatus = { status: 'unknown', finalListed: false, freshnessClass: 'unknown' };
  let input: KeyStatusInput | undefined;
  try {
    input = typeof source === 'function' ? source() : source;
  } catch {
    return unknown;
  }
  if (typeof input !== 'object' || input === null) return unknown;
  const status = normalizeStatus(input.status);
  const freshnessClass = normalizeFreshness(input.freshnessClass);
  if (opts.maxStatusAgeMs !== undefined) {
    const now = opts.now === undefined ? Number.NaN : Date.parse(opts.now);
    const asOf = typeof input.asOf === 'string' ? Date.parse(input.asOf) : Number.NaN;
    if (Number.isNaN(now) || Number.isNaN(asOf) || now - asOf > opts.maxStatusAgeMs) return { ...unknown, freshnessClass };
  }
  return { status, finalListed: input.finalListed === true, freshnessClass };
}

/** V05 + V07: the signer key is known and not revoked, unless the statement is finalListed. */
export function checkKeyStatus(s: EvaluatedStatus): Result<{ readonly finalStatement: boolean }, AppError> {
  switch (s.status) {
    case 'unknown':
      return err(code('SECURITY_SIGNER_UNKNOWN'));
    case 'revoked':
      return s.finalListed ? ok({ finalStatement: true }) : err(code('SECURITY_KEY_REVOKED'));
    case 'expired':
      return err(appError('EXPIRED', { params: { reason: 'signer_key_expired' } }));
    default:
      return ok({ finalStatement: false });
  }
}

/** V11: the context is in the inventory, the handle's role may sign it and the payload passes its schema. */
export function checkSignable(context: string, handle: KeyHandle, payload: unknown): Result<InventoryEntry, AppError> {
  const entry = checkContextKnown(context);
  if (!entry.ok) return entry;
  if (entry.value.signerRole !== handle.role) return err(code('SECURITY_CONTEXT_MISMATCH', { reason: 'role_may_not_sign' }));
  const schema = payloadSchemaFor(context);
  if (!schema || !schema.safeParse(payload).success) return err(code('SECURITY_CONTEXT_MISMATCH', { reason: 'payload_schema' }));
  return entry;
}
