// classrup.security.envelope/v1: sign over JCS({ v, ctx, kid, alg, signedAt, payloadHash }) and verify with
// one accepted flag. Pure helpers over the JCS and strict Ed25519 primitives; nothing is stored or looked up.
import { appError, err, isTimestamp, ok, type AppError, type Result } from '@classrup/kernel';
import { signatureErrors } from './errors.ts';
import { publicKeyFromDidKey } from './primitives/didkey.ts';
import { ed25519VerifyStrict, keyIdOf, ED25519_PUBLIC_KEY_BYTES } from './primitives/ed25519.ts';
import { fromBase64url, toBase64url, utf8 } from './primitives/encoding.ts';
import { checkJsonValue, jcsBytes, parseStrictJson } from './primitives/jcs.ts';
import type { InventoryEntry } from './inventory.ts';
import {
  canonicalPayload,
  checkAlgorithm,
  checkBinding,
  checkContextExpected,
  checkContextKnown,
  checkKeyStatus,
  checkPayloadHash,
  checkPayloadSize,
  checkSignable,
  checkVersion,
  maxPayloadBytes,
  payloadHashOfBytes,
  readKeyStatus,
} from './rules.ts';
import { signatureEnvelopeSchema, type KeyHandle, type KeyStatusSource, type SignatureEnvelope, type SignOptions, type VerifyExpectations, type VerifyFlag, type VerifyResult } from './schema.ts';

/** signedAt claims further than this from the verifier's first-seen time are flagged clockClaim. */
export const CLOCK_CLAIM_TOLERANCE_MS = 24 * 60 * 60 * 1000;
/** Key status handed to verify on a relay must be at most this old (workflow timeouts). */
export const RELAY_MAX_STATUS_AGE_MS = 60_000;
const MAX_ENVELOPE_TEXT_BYTES = 65_536 + 4096;

function header(e: { v: number; ctx: string; kid: string; alg: string; signedAt: string; payloadHash: string }) {
  return { v: e.v, ctx: e.ctx, kid: e.kid, alg: e.alg, signedAt: e.signedAt, payloadHash: e.payloadHash };
}

/** payloadHash of a payload: sha256-<base64url> of SHA-256(JCS(payload)) after the V01/V03 checks. */
export function payloadHashOf(payload: unknown, context?: string): Result<string, AppError> {
  const entry = context === undefined ? undefined : checkContextKnown(context);
  if (entry && !entry.ok) return entry;
  const c = canonicalPayload(payload, entry?.value);
  return c.ok ? ok(payloadHashOfBytes(c.value.bytes)) : c;
}

/** The exact signed bytes of an envelope: RFC 8785 JCS of the six header members. */
export function signedHeaderBytes(envelope: Pick<SignatureEnvelope, 'v' | 'ctx' | 'kid' | 'alg' | 'signedAt' | 'payloadHash'>): Result<Uint8Array, AppError> {
  const bytes = jcsBytes(header(envelope));
  return bytes.ok ? bytes : err(signatureErrors.make('SECURITY_SIGNATURE_INVALID', { params: { reason: 'header' } }));
}

function isKeyHandle(h: unknown): h is KeyHandle {
  if (typeof h !== 'object' || h === null || h instanceof Uint8Array || ArrayBuffer.isView(h)) return false;
  const k = h as Partial<KeyHandle>;
  return typeof k.sign === 'function' && typeof k.kid === 'string' && typeof k.role === 'string';
}

/**
 * Signs a payload under an inventory context with an unlocked key handle (never raw key bytes). The
 * envelope is hash-only unless inline is set; equal inputs give byte-identical envelopes (RFC 8032).
 */
export function sign(context: string, payload: unknown, handle: KeyHandle, options: SignOptions): Result<SignatureEnvelope, AppError> {
  if (!isKeyHandle(handle)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'keyHandle', code: 'NOT_A_KEY_HANDLE' }] }));
  const entry = checkSignable(context, handle, payload);
  if (!entry.ok) return entry;
  const canonical = canonicalPayload(payload, entry.value);
  if (!canonical.ok) return canonical;
  const signedAt = options.signedAt ?? options.clock.iso();
  if (!isTimestamp(signedAt)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'signedAt', code: 'INVALID_TIMESTAMP' }] }));
  const h = { v: 1, ctx: context, kid: handle.kid, alg: 'ed25519', signedAt, payloadHash: payloadHashOfBytes(canonical.value.bytes) };
  const bytes = signedHeaderBytes(h);
  if (!bytes.ok) return bytes;
  const sig = handle.sign(context, bytes.value);
  if (!sig.ok) return sig;
  return ok({ ...h, ...(options.inline ? { payload: canonical.value.value } : {}), sig: toBase64url(sig.value) });
}

function resolveSignerKey(key: VerifyExpectations['signerPublicKey']): Uint8Array | undefined {
  if (key instanceof Uint8Array) return key.length === ED25519_PUBLIC_KEY_BYTES ? key : undefined;
  if (typeof key !== 'string') return undefined;
  if (key.startsWith('did:key:')) {
    const r = publicKeyFromDidKey(key);
    return r.ok ? r.value : undefined;
  }
  const bytes = fromBase64url(key);
  return bytes && bytes.length === ED25519_PUBLIC_KEY_BYTES ? bytes : undefined;
}

interface Outcome {
  signatureValid: boolean;
  contextOk: boolean;
  bindingOk: boolean;
  payloadHashOk: boolean;
}

function result(o: Outcome, status: ReturnType<typeof readKeyStatus>, flags: VerifyFlag[], reason: string | undefined): VerifyResult {
  return {
    accepted: reason === undefined,
    ...(reason === undefined ? {} : { reason }),
    ...o,
    keyStatus: status.status,
    freshnessClass: status.freshnessClass,
    flags,
  };
}

function clockFlag(signedAt: string, receivedAt: string | undefined): VerifyFlag[] {
  if (receivedAt === undefined || !isTimestamp(receivedAt)) return [];
  return Math.abs(Date.parse(signedAt) - Date.parse(receivedAt)) > CLOCK_CLAIM_TOLERANCE_MS ? ['clockClaim'] : [];
}

function toRecord(envelope: unknown): Result<Record<string, unknown>, AppError> {
  const malformed = err(signatureErrors.make('SECURITY_SIGNATURE_INVALID', { params: { reason: 'malformed' } }));
  if (typeof envelope === 'string') {
    if (utf8(envelope).length > MAX_ENVELOPE_TEXT_BYTES) return err(appError('PAYLOAD_TOO_LARGE', { params: { limitBytes: MAX_ENVELOPE_TEXT_BYTES } }));
    const parsed = parseStrictJson(envelope, { maxDepth: 34 });
    if (!parsed.ok) return parsed.error === 'DUPLICATE_KEY' || parsed.error === 'LONE_SURROGATE' ? err(signatureErrors.make('SECURITY_PAYLOAD_NOT_CANONICAL', { params: { reason: parsed.error } })) : malformed;
    envelope = parsed.value;
  }
  if (typeof envelope !== 'object' || envelope === null || Array.isArray(envelope)) return malformed;
  if (checkJsonValue(envelope, { maxDepth: 34 }) === 'NOT_JSON') return malformed;
  return ok(envelope as Record<string, unknown>);
}

/** Size of a payload source before any parsing or hashing (V01). */
function rawPayloadSize(p: unknown, entry: InventoryEntry): Result<void, AppError> {
  if (typeof p === 'string') return checkPayloadSize(utf8(p).length, entry);
  if (p === undefined) return ok(undefined);
  const bytes = jcsBytes(p, { maxBytes: maxPayloadBytes(entry) });
  if (!bytes.ok && bytes.error === 'TOO_LARGE') return checkPayloadSize(maxPayloadBytes(entry) + 1, entry);
  return ok(undefined);
}

function verifyUnsafe(envelope: unknown, x: VerifyExpectations, keyStatus: KeyStatusSource, payload: unknown): VerifyResult {
  const none: Outcome = { signatureValid: false, contextOk: false, bindingOk: false, payloadHashOk: false };
  const status = readKeyStatus(keyStatus, { ...(x.now === undefined ? {} : { now: x.now }), ...(x.maxStatusAgeMs === undefined ? {} : { maxStatusAgeMs: x.maxStatusAgeMs }) });
  const fail = (e: AppError, o: Outcome = none, flags: VerifyFlag[] = []) => result(o, status, flags, e.code);
  const rec = toRecord(envelope);
  if (!rec.ok) return fail(rec.error);
  const env = rec.value;
  // Structural checks before any hashing or cryptographic work: version, algorithm, context, size, shape.
  const version = checkVersion(env['v']);
  if (!version.ok) return fail(version.error);
  const alg = checkAlgorithm(env['alg'], env['sig']);
  if (!alg.ok) return fail(alg.error);
  const known = checkContextKnown(env['ctx']);
  if (!known.ok) return fail(known.error);
  const entry = known.value;
  const inline = env['payload'];
  for (const p of [inline, payload]) {
    const size = rawPayloadSize(p, entry);
    if (!size.ok) return fail(size.error);
  }
  const shape = signatureEnvelopeSchema.safeParse(env);
  if (!shape.success) return fail(signatureErrors.make('SECURITY_SIGNATURE_INVALID', { params: { reason: 'shape' } }));
  const e = shape.data;
  const flags = clockFlag(e.signedAt, x.receivedAt);
  let canonical: Uint8Array | undefined;
  let value: unknown;
  for (const p of [inline, payload]) {
    if (p === undefined) continue;
    const c = canonicalPayload(p, entry);
    if (!c.ok) return fail(c.error, none, flags);
    if (canonical && payloadHashOfBytes(canonical) !== payloadHashOfBytes(c.value.bytes)) {
      return fail(signatureErrors.make('SECURITY_PAYLOAD_HASH_MISMATCH', { params: { reason: 'inline_differs' } }), none, flags);
    }
    canonical = c.value.bytes;
    value = c.value.value;
  }
  // Cryptographic and expectation checks; every outcome is computed, the first failure is the reason.
  const hashOk = checkPayloadHash(canonical, e.payloadHash);
  const key = resolveSignerKey(x.signerPublicKey);
  const bytes = signedHeaderBytes(e);
  const signatureValid = key !== undefined && bytes.ok && ed25519VerifyStrict(alg.value, bytes.value, key);
  const kidOk = key !== undefined && keyIdOf(key) === e.kid;
  const ctxOk = checkContextExpected(e.ctx, x.expectedContext);
  const bindingOk = canonical === undefined ? err(signatureErrors.make('SECURITY_BINDING_MISMATCH', { params: { reason: 'payload_missing' } })) : checkBinding(entry, value, x.expectedBinding);
  const keyOk = checkKeyStatus(status);
  const o: Outcome = { signatureValid, contextOk: ctxOk.ok, bindingOk: bindingOk.ok, payloadHashOk: hashOk.ok };
  const allFlags: VerifyFlag[] = keyOk.ok && keyOk.value.finalStatement ? [...flags, 'finalStatement'] : flags;
  if (key === undefined) return result(o, status, allFlags, 'SECURITY_SIGNER_UNKNOWN');
  if (!signatureValid) return result(o, status, allFlags, 'SECURITY_SIGNATURE_INVALID');
  if (!hashOk.ok) return result(o, status, allFlags, hashOk.error.code);
  if (!ctxOk.ok) return result(o, status, allFlags, ctxOk.error.code);
  if (!bindingOk.ok) return result(o, status, allFlags, bindingOk.error.code);
  if (!kidOk) return result(o, status, allFlags, 'SECURITY_SIGNER_UNKNOWN');
  if (!keyOk.ok) return result(o, status, allFlags, keyOk.error.code);
  return result(o, status, allFlags, undefined);
}

/**
 * Verifies an envelope (object or received JSON text) against the caller's expected context and binding,
 * the signer's public key and the caller-supplied key status at the statement's first-seen time. accepted
 * is true only when signature, context, binding, payload hash and key status all pass; never throws.
 */
export function verify(envelope: unknown, expectations: VerifyExpectations, keyStatus: KeyStatusSource, payload?: unknown): VerifyResult {
  try {
    return verifyUnsafe(envelope, expectations, keyStatus, payload);
  } catch {
    return {
      accepted: false,
      reason: 'SECURITY_SIGNATURE_INVALID',
      signatureValid: false,
      contextOk: false,
      bindingOk: false,
      payloadHashOk: false,
      keyStatus: 'unknown',
      freshnessClass: 'unknown',
      flags: [],
    };
  }
}

export type ImportClassification = { readonly state: 'verified'; readonly result: VerifyResult } | { readonly state: 'unverified'; readonly code: string; readonly result: VerifyResult } | { readonly state: 'opaque'; readonly code: 'UNSUPPORTED_SCHEMA_VERSION' };

/**
 * Import rule: every envelope is re-verified under its recorded context with the record's payload;
 * failures stay as unverified with their code and unknown versions are kept opaque and flagged.
 */
export function classifyImported(envelope: unknown, expectations: VerifyExpectations, keyStatus: KeyStatusSource, payload?: unknown): ImportClassification {
  const r = verify(envelope, expectations, keyStatus, payload);
  if (r.accepted) return { state: 'verified', result: r };
  if (r.reason === 'UNSUPPORTED_SCHEMA_VERSION') return { state: 'opaque', code: 'UNSUPPORTED_SCHEMA_VERSION' };
  return { state: 'unverified', code: r.reason ?? 'SECURITY_SIGNATURE_INVALID', result: r };
}
