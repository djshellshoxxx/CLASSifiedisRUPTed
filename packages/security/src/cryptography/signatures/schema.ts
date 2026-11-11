// Value types and zod schemas of F16.S02.M03: key handle contract, envelope classrup.security.envelope/v1,
// the CTR-FED-001 envelope, per-context payload schemas, key status input and the verification result.
import { money, timestamp, z, type AppError, type Clock, type Result } from '@classrup/kernel';

/** Key roles a handle can carry (F16.S02.M01 root and device keys; relay and release keys of operators). */
export type KeyRole = 'root' | 'device' | 'relay' | 'release';

/**
 * Signing capability without key bytes. Implemented by F16.S02.M01 handles; `sign` enforces the handle's
 * own role rules for `purpose` (the statement type, envelope context or raw prefix being signed).
 */
export interface KeyHandle {
  readonly role: KeyRole;
  /** Key ID: SHA-256 thumbprint of the raw public key, base64url. */
  readonly kid: string;
  /** did:key of this key. */
  readonly did: string;
  /** A copy of the raw 32-byte Ed25519 public key. */
  readonly publicKey: Uint8Array;
  sign(purpose: string, message: Uint8Array): Result<Uint8Array, AppError>;
}

export const CID_PATTERN = /^sha256-[A-Za-z0-9_-]{43}$/;
export const KID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const SIG_PATTERN = /^[A-Za-z0-9_-]{86}$/;
export const SCHEMA_NAME_PATTERN = /^classrup\.[a-z0-9]+\.[a-z0-9_]+\/v[1-9][0-9]*$/;
export const CONTEXT_PATTERN = /^classrup\/[a-z0-9-]+\/v[1-9][0-9]*$/;

export const cid = () => z.string().regex(CID_PATTERN);
export const keyId = () => z.string().regex(KID_PATTERN);

// ---------------------------------------------------------------- CTR-FED-001 envelope (FED-7)

export interface FedEnvelope {
  readonly v: 1;
  readonly type: string;
  readonly cid: string;
  readonly author: string;
  readonly createdAt: string;
  readonly seq: number;
  readonly prev?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly ext?: Readonly<Record<string, unknown>>;
  readonly sig: string;
  readonly [member: string]: unknown;
}

/** An envelope before signing: cid and sig are computed by signEnvelope. */
export type FedDraft = Omit<FedEnvelope, 'cid' | 'sig'>;

export interface VerifiedEnvelope {
  readonly cid: string;
  readonly author: string;
  /** The verification key: ext.signerKey when present, otherwise the author did:key. */
  readonly signerKey: string;
  readonly envelope: FedEnvelope;
}

// ---------------------------------------------------------------- classrup.security.envelope/v1

export const ENVELOPE_SCHEMA = 'classrup.security.envelope/v1';

export interface SignatureEnvelope {
  readonly v: number;
  readonly ctx: string;
  readonly kid: string;
  readonly alg: string;
  readonly signedAt: string;
  readonly payloadHash: string;
  readonly payload?: unknown;
  readonly sig: string;
}

/** Strict structural schema of a v1 envelope (version, algorithm and context are checked by rules first). */
export const signatureEnvelopeSchema = z.strictObject({
  v: z.literal(1),
  ctx: z.string().regex(CONTEXT_PATTERN),
  kid: keyId(),
  alg: z.literal('ed25519'),
  signedAt: timestamp(),
  payloadHash: cid(),
  payload: z.unknown().optional(),
  sig: z.string().regex(SIG_PATTERN),
});

export interface SignOptions {
  /** Embed the canonical payload in the envelope (default false: hash-only). */
  readonly inline?: boolean;
  /** Clock for the signedAt claim; signedAt overrides it for reproducible envelopes. */
  readonly clock: Clock;
  readonly signedAt?: string;
}

// ---------------------------------------------------------------- payload schemas per context

/** F08.S02.M02 consent field set: the binding fields are required, other consent fields are carried as signed. */
export const consentPayloadSchema = z.looseObject({
  subjectType: z.string().min(1).max(64),
  subjectRef: z.string().min(1).max(128),
  subjectRevision: z.int().min(1),
  subjectRevisionHash: cid(),
  statementKey: z.string().min(1).max(128),
});

/** F09.S02.M01 classrup.commerce.receipt/v1 statement. */
export const receiptPayloadSchema = z.strictObject({
  claimCid: cid(),
  dealId: z.string().min(1).max(64),
  contextCid: cid(),
  amount: money({ sign: 'positive' }),
  method: z.string().min(1).max(64),
  text: z
    .string()
    .refine((s) => [...s].length <= 280, { params: { code: 'TOO_BIG' } })
    .optional(),
});

/** classrup/revocation-list/v1 head (F16.S02.M02). */
export const revocationListHeadSchema = z.strictObject({
  relayId: z.string().min(1).max(256),
  listSeq: z.int().min(0),
  issuedAt: timestamp(),
  nextUpdateBy: timestamp(),
  headHash: cid(),
  entryCount: z.int().min(0),
});

export type RevocationListHead = z.output<typeof revocationListHeadSchema>;

/** classrup/release-hold/v1 (F16.S03.M03). */
export const releaseHoldPayloadSchema = z.strictObject({
  releaseKeyId: keyId(),
  heldBuildIds: z.array(z.string().min(1).max(128)).min(1).max(64),
  reason: z.string().min(1).max(500),
  issuedAt: timestamp(),
  expiresAt: timestamp(),
});

// ---------------------------------------------------------------- verification input and result

/** Key status as F16.S02.M02 get_status (or F07.S02.M01 KeyStatusPort) reports it, at the statement's first-seen time. */
export interface KeyStatusInput {
  readonly status: string;
  /** True only when the statement's cid is in the finalCids of the key's account_deleted revocation. */
  readonly finalListed?: boolean;
  readonly freshnessClass?: string;
  /** When the status was obtained; required when expectations set maxStatusAgeMs. */
  readonly asOf?: string;
}

export type KeyStatusSource = KeyStatusInput | (() => KeyStatusInput | undefined) | undefined;

export type FreshnessClass = 'fresh' | 'stale' | 'unknown';
export type ReportedKeyStatus = 'active' | 'revocation_pending' | 'contested' | 'revoked' | 'expired' | 'unknown';

export interface VerifyExpectations {
  readonly expectedContext: string;
  /** Required for revision-bound contexts: every binding field of the context. */
  readonly expectedBinding?: Readonly<Record<string, unknown>>;
  /** Public key of kid (raw bytes, base64url or did:key), as resolved by the caller. */
  readonly signerPublicKey: Uint8Array | string | undefined;
  /** The verifier's own first-seen time of the statement; enables the clockClaim flag. */
  readonly receivedAt?: string;
  /** Verification time; with maxStatusAgeMs, an older key status counts as unknown (relays: 60 s). */
  readonly now?: string;
  readonly maxStatusAgeMs?: number;
}

export type VerifyFlag = 'clockClaim' | 'finalStatement';

export interface VerifyResult {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly signatureValid: boolean;
  readonly contextOk: boolean;
  readonly bindingOk: boolean;
  readonly payloadHashOk: boolean;
  readonly keyStatus: ReportedKeyStatus;
  readonly freshnessClass: FreshnessClass;
  readonly flags: readonly VerifyFlag[];
}
