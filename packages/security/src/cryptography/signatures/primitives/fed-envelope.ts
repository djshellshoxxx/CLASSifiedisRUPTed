// CTR-FED-001 envelopes with the FED-7 definitions: cid = "sha256-" + base64url(SHA-256(JCS(envelope minus
// sig and cid))) and sig = Ed25519 over JCS(envelope minus sig), so the cid itself is signed.
import { appError, err, isTimestamp, ok, type AppError, type Result } from '@classrup/kernel';
import { envelopePrimitiveErrors } from '../errors.ts';
import { CID_PATTERN, SCHEMA_NAME_PATTERN, type FedDraft, type FedEnvelope, type KeyHandle, type VerifiedEnvelope } from '../schema.ts';
import { publicKeyFromDidKey } from './didkey.ts';
import { ed25519VerifyStrict, sha256Cid } from './ed25519.ts';
import { fromBase64url, toBase64url } from './encoding.ts';
import { checkJsonValue, jcsBytes, parseStrictJson, type JsonIssue } from './jcs.ts';

export const MAX_ENVELOPE_BYTES = 262_144;
export const MAX_ENVELOPE_DEPTH = 32;
export const MAX_EXT_BYTES = 4096;
export const MAX_CRIT_MEMBERS = 16;
/** Extension members every reader understands; the F11.S01.M01 registry extends this set per deployment. */
export const DEFAULT_UNDERSTOOD_EXT: ReadonlySet<string> = new Set(['signerKey', 'stream', 'crit']);

const LIMITS = { maxDepth: MAX_ENVELOPE_DEPTH, maxBytes: MAX_ENVELOPE_BYTES } as const;

function notCanonical(issue: JsonIssue | string): AppError {
  return envelopePrimitiveErrors.make('FEDERATION_ENVELOPE_NOT_CANONICALIZABLE', { params: { reason: issue } });
}

function invalid(path: string, code: string): AppError {
  return appError('VALIDATION_FAILED', { fields: [{ path, code }] });
}

function sigInvalid(reason: string): AppError {
  return envelopePrimitiveErrors.make('FED_SIGNATURE_INVALID', { params: { reason } });
}

function without(env: Readonly<Record<string, unknown>>, ...keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(env)) if (!keys.includes(k)) out[k] = v;
  return out;
}

/** cid over the envelope without sig and cid (FED-7). */
export function cidOf(envelope: Readonly<Record<string, unknown>>): Result<string, AppError> {
  const bytes = jcsBytes(without(envelope, 'sig', 'cid'), LIMITS);
  return bytes.ok ? ok(sha256Cid(bytes.value)) : err(notCanonical(bytes.error));
}

/** The exact bytes covered by sig: JCS of the envelope without sig (the cid stays in). */
export function signedBytesOf(envelope: Readonly<Record<string, unknown>>): Result<Uint8Array, AppError> {
  const bytes = jcsBytes(without(envelope, 'sig'), LIMITS);
  return bytes.ok ? bytes : err(notCanonical(bytes.error));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** CTR-SCH-001 SCH-2 ext rules (F11.S01.M03 V08). */
function checkExt(ext: unknown, understood: ReadonlySet<string>): AppError | undefined {
  if (ext === undefined) return undefined;
  if (!isRecord(ext)) return invalid('ext', 'INVALID_TYPE');
  const bytes = jcsBytes(ext, LIMITS);
  if (!bytes.ok) return notCanonical(bytes.error);
  if (bytes.value.length > MAX_EXT_BYTES) return invalid('ext', 'TOO_BIG');
  const crit = ext['crit'];
  if (crit === undefined) return undefined;
  if (!Array.isArray(crit) || crit.length < 1 || crit.length > MAX_CRIT_MEMBERS) return invalid('ext.crit', 'INVALID_LENGTH');
  const names = new Set<string>();
  for (const name of crit) {
    if (typeof name !== 'string' || names.has(name) || !(name in ext)) return invalid('ext.crit', 'INVALID_MEMBER');
    if (!understood.has(name)) return invalid('ext.crit', 'NOT_UNDERSTOOD');
    names.add(name);
  }
  return undefined;
}

function checkShape(env: Record<string, unknown>, understood: ReadonlySet<string>, signed: boolean): AppError | undefined {
  if (env['v'] !== 1) return invalid('v', 'INVALID_VALUE');
  if (typeof env['type'] !== 'string' || !SCHEMA_NAME_PATTERN.test(env['type'])) return invalid('type', 'INVALID_FORMAT');
  if (typeof env['createdAt'] !== 'string' || !isTimestamp(env['createdAt'])) return invalid('createdAt', 'INVALID_TIMESTAMP');
  if (!Number.isSafeInteger(env['seq']) || (env['seq'] as number) < 1) return invalid('seq', 'INVALID_VALUE');
  if (env['prev'] !== undefined && (typeof env['prev'] !== 'string' || !CID_PATTERN.test(env['prev']))) return invalid('prev', 'INVALID_FORMAT');
  if (!isRecord(env['payload'])) return invalid('payload', 'INVALID_TYPE');
  if (signed && typeof env['cid'] !== 'string') return invalid('cid', 'REQUIRED');
  if (signed && typeof env['sig'] !== 'string') return sigInvalid('missing');
  return checkExt(env['ext'], understood);
}

/**
 * Signs a draft: sets ext.signerKey when the signer is not the author key (a device key of the author
 * principal), computes the cid, then signs JCS(envelope minus sig) with the handle under the draft type.
 */
export function signEnvelope(draft: FedDraft, signer: KeyHandle, understood: ReadonlySet<string> = DEFAULT_UNDERSTOOD_EXT): Result<FedEnvelope, AppError> {
  const base = without(draft as Record<string, unknown>, 'sig', 'cid');
  const value = checkJsonValue(base, LIMITS);
  if (value) return err(notCanonical(value));
  const author = publicKeyFromDidKey(base['author']);
  if (!author.ok) return author;
  const ext = isRecord(base['ext']) ? { ...base['ext'] } : base['ext'] === undefined ? undefined : base['ext'];
  if (signer.did !== base['author']) {
    if (isRecord(ext) && ext['signerKey'] !== undefined && ext['signerKey'] !== signer.did) return err(invalid('ext.signerKey', 'SIGNER_MISMATCH'));
    base['ext'] = { ...(isRecord(ext) ? ext : {}), signerKey: signer.did };
  } else if (isRecord(ext) && ext['signerKey'] !== undefined && ext['signerKey'] !== signer.did) {
    return err(invalid('ext.signerKey', 'SIGNER_MISMATCH'));
  }
  const shape = checkShape(base, understood, false);
  if (shape) return err(shape);
  const id = cidOf(base);
  if (!id.ok) return id;
  const withCid = { ...base, cid: id.value };
  const bytes = signedBytesOf(withCid);
  if (!bytes.ok) return bytes;
  const sig = signer.sign(base['type'] as string, bytes.value);
  if (!sig.ok) return sig;
  return ok({ ...withCid, sig: toBase64url(sig.value) } as FedEnvelope);
}

/**
 * Verifies an envelope given as an object or as received JSON text (parsed strictly, duplicate members
 * refused). Returns the cid, the author and the verification key; delegation is decided by the caller.
 */
export function verifyEnvelope(input: unknown, opts: { readonly understoodExt?: ReadonlySet<string> } = {}): Result<VerifiedEnvelope, AppError> {
  const understood = opts.understoodExt ?? DEFAULT_UNDERSTOOD_EXT;
  let value: unknown = input;
  if (typeof input === 'string') {
    const parsed = parseStrictJson(input, LIMITS);
    if (!parsed.ok) return err(notCanonical(parsed.error));
    value = parsed.value;
  } else {
    const issue = checkJsonValue(input, LIMITS);
    if (issue) return err(notCanonical(issue));
    const size = jcsBytes(input, LIMITS);
    if (!size.ok) return err(notCanonical(size.error));
  }
  if (!isRecord(value)) return err(invalid('envelope', 'INVALID_TYPE'));
  const env = value;
  const shape = checkShape(env, understood, true);
  if (shape) return err(shape);
  const sig = fromBase64url(env['sig'] as string);
  if (!sig || sig.length !== 64) return err(sigInvalid('encoding'));
  const author = publicKeyFromDidKey(env['author']);
  if (!author.ok) return author;
  const ext = env['ext'] as Record<string, unknown> | undefined;
  const signerDid = ext?.['signerKey'] === undefined ? (env['author'] as string) : ext['signerKey'];
  const signerKey = publicKeyFromDidKey(signerDid);
  if (!signerKey.ok) return signerKey;
  const id = cidOf(env);
  if (!id.ok) return id;
  if (id.value !== env['cid']) return err(envelopePrimitiveErrors.make('FEDERATION_CID_MISMATCH'));
  const bytes = signedBytesOf(env);
  if (!bytes.ok) return bytes;
  if (!ed25519VerifyStrict(sig, bytes.value, signerKey.value)) return err(sigInvalid('verify'));
  return ok({ cid: id.value, author: env['author'] as string, signerKey: signerDid as string, envelope: env as unknown as FedEnvelope });
}

/** UTF-8 size of the canonical form of an envelope (relay statement limits are applied by callers). */
export function canonicalSizeOf(envelope: unknown): number | undefined {
  const bytes = jcsBytes(envelope, LIMITS);
  return bytes.ok ? bytes.value.length : undefined;
}
