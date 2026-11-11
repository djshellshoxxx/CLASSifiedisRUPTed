// Signing-prefix inventory (F16.S02.M03 domain note): every signing prefix and signature format in the
// system with its owner, signer, payload schema and binding. Frozen code table, reviewed in the repository.
import type { z } from '@classrup/kernel';
import { CONTEXT_PATTERN, consentPayloadSchema, receiptPayloadSchema, releaseHoldPayloadSchema, revocationListHeadSchema, type KeyRole } from './schema.ts';

export type InventoryKind = 'envelope' | 'raw' | 'format';

/** Audience, single-use nonce and expiry that a challenge or request prefix binds (domain requirement 01.R04). */
export interface ChallengeBinding {
  readonly audience: string;
  readonly nonce: string;
  readonly expiry: string;
}

export interface InventoryEntry {
  /** Envelope context (classrup/<purpose>/v<n>), raw prefix (classrup-<purpose>:v<n>) or format name. */
  readonly id: string;
  readonly kind: InventoryKind;
  readonly owner: string;
  readonly signer: string;
  /** Envelope contexts: the only key role that may sign (V11). */
  readonly signerRole?: KeyRole;
  readonly payloadSchemaId?: string;
  readonly maxBytes?: number;
  /** Payload fields bound to the caller's expectations (V06); empty when the context is not revision-bound. */
  readonly binding: readonly string[];
  /** The signed bytes of this entry always begin with exactly this text. */
  readonly leadingBytes: string;
  readonly challenge?: ChallengeBinding;
  /** Challenge or request entries must carry audience, nonce and expiry. */
  readonly isChallenge?: boolean;
  /** Profiles or tags carried inside the format (RFC 9421 tags). */
  readonly tags?: readonly string[];
}

export const MAX_PAYLOAD_BYTES = 65_536;

/** Leading bytes of the F16 header JCS: keys sort as alg, ctx, kid, payloadHash, signedAt, v. */
export function envelopeLeadingBytes(context: string): string {
  return `{"alg":"ed25519","ctx":${JSON.stringify(context)}`;
}

function envelope(id: string, owner: string, signer: string, signerRole: KeyRole, payloadSchemaId: string, maxBytes: number, binding: readonly string[]): InventoryEntry {
  return { id, kind: 'envelope', owner, signer, signerRole, payloadSchemaId, maxBytes, binding, leadingBytes: envelopeLeadingBytes(id) };
}

function raw(id: string, owner: string, signer: string, challenge?: ChallengeBinding): InventoryEntry {
  return { id, kind: 'raw', owner, signer, binding: [], leadingBytes: `${id}:`, ...(challenge ? { challenge, isChallenge: true } : {}) };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

const ENTRIES: readonly InventoryEntry[] = deepFreeze([
  envelope('classrup/consent/v1', 'F08.S02.M02', 'device key of the signing principal', 'device', 'classrup.comms.consent/v1', MAX_PAYLOAD_BYTES, ['subjectType', 'subjectRef', 'subjectRevision', 'subjectRevisionHash', 'statementKey']),
  envelope('classrup/receipt/v1', 'F09.S02.M01', 'device key of the issuing claim party, linked to its principal by the keyLink carried in the receipt', 'device', 'classrup.commerce.receipt/v1', MAX_PAYLOAD_BYTES, ['claimCid', 'dealId', 'contextCid']),
  envelope('classrup/revocation-list/v1', 'F16.S02.M02', 'relay key of the publishing relay', 'relay', 'classrup/revocation-list/v1', 4096, []),
  envelope('classrup/release-hold/v1', 'F16.S03.M03', 'release key pinned in the running build', 'release', 'classrup/release-hold/v1', 4096, []),
  raw('classrup-login:v1', 'F07.S01.M02', 'device key of the principal logging in', { audience: 'relayId', nonce: 'single-use challenge nonce', expiry: 'issuer-recorded challenge expiry of at most 120 s' }),
  raw('classrup-device-link:v1', 'F07.S01.M01', 'the new device key (possession signature)'),
  raw('classrup-device-link-auth:v1', 'F07.S01.M01', 'device key of the principal'),
  raw('classrup-handle:v1', 'F07.S01.M01', 'device key of the principal'),
  raw('classrup-recovery-notice:v1', 'F07.S01.M03', 'recovered root key'),
  raw('classrup-recovery-dispute:v1', 'F07.S01.M03', 'device key of the principal'),
  raw('classrup-review:v1', 'F07.S03.M01', 'device key of the reviewer'),
  raw('classrup-review-ticket:v1', 'F07.S03.M01', 'device key of the reviewed party'),
  raw('classrup-attestation:v1', 'F07.S03.M02', 'device key of the attester'),
  raw('classrup-attestation-cosign:v1', 'F07.S03.M02', 'device key of the co-signer'),
  raw('classrup-attestation-endorsement:v1', 'F07.S03.M02', 'device key of the endorser'),
  raw('classrup-relay-receipt:v1', 'F15.S02.M01', 'relay transport key'),
  raw('classrup-relay-rotate:v1', 'F15.S02.M01', 'retiring and new relay transport keys'),
  raw('classrup-relay-revoke:v1', 'F15.S02.M01', 'relay transport key or offline relay recovery key'),
  raw('classrup-relay-restore:v1', 'F15.S03.M03', 'relay transport key'),
  raw('classrup-backup:v1', 'F15.S03.M02', 'relay operator backup key'),
  raw('classrup-backup-manifest:v1', 'F15.S03.M02', 'relay operator backup key'),
  raw('classrup-tenant-config:v1', 'F15.S04.M03', 'relay operator key'),
  raw('classrup-release:v1', 'F15.S01.M03', 'release signing key'),
  { id: 'ctr-fed-001-envelope', kind: 'format', owner: 'F11.S01.M03', signer: 'author did:key or ext.signerKey device key', binding: [], leadingBytes: '{"author":' },
  {
    id: 'rfc9421-http-message-signature',
    kind: 'format',
    owner: 'F11.S01.M03',
    signer: 'device request key (tag classrup/relay-request/v1) or relay key (FED-10 profile)',
    binding: [],
    leadingBytes: '"@method"',
    isChallenge: true,
    challenge: { audience: '@target-uri with the destination authority', nonce: 'nonce parameter (batchId for inbox batches)', expiry: 'expires parameter at most created + 300 s' },
    tags: ['classrup/relay-request/v1', 'fed-10'],
  },
]);

/** Contexts and prefixes retired before any release; no signer may use them again. */
export const RETIRED_SIGNING_CONTEXTS: readonly string[] = deepFreeze(['classrup/attestation/v1', 'classrup/key-link/v1', 'classrup/key-rotation/v1', 'classrup/key-revoke/v1', 'classrup/login/v1', 'classrup/export-manifest/v1']);

const PAYLOAD_SCHEMAS: Readonly<Record<string, z.ZodType>> = Object.freeze({
  'classrup/consent/v1': consentPayloadSchema,
  'classrup/receipt/v1': receiptPayloadSchema,
  'classrup/revocation-list/v1': revocationListHeadSchema,
  'classrup/release-hold/v1': releaseHoldPayloadSchema,
});

/** The frozen inventory; its entries and their arrays cannot be changed at runtime. */
export function inventory(): readonly InventoryEntry[] {
  return ENTRIES;
}

export function envelopeContext(context: string): InventoryEntry | undefined {
  return ENTRIES.find((e) => e.kind === 'envelope' && e.id === context);
}

export function payloadSchemaFor(context: string): z.ZodType | undefined {
  return Object.hasOwn(PAYLOAD_SCHEMAS, context) ? PAYLOAD_SCHEMAS[context] : undefined;
}

export interface PrefixConflict {
  readonly a: string;
  readonly b: string;
}

/** Pairs of entries whose leading bytes are equal or where one is a prefix of the other. */
export function findPrefixConflicts(entries: readonly InventoryEntry[]): PrefixConflict[] {
  const out: PrefixConflict[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!;
      const b = entries[j]!;
      if (a.leadingBytes.startsWith(b.leadingBytes) || b.leadingBytes.startsWith(a.leadingBytes)) out.push({ a: a.id, b: b.id });
    }
  }
  return out;
}

export type InventoryIssue =
  | { readonly kind: 'prefix_conflict'; readonly a: string; readonly b: string }
  | { readonly kind: 'challenge_unbound'; readonly id: string; readonly missing: readonly string[] }
  | { readonly kind: 'invalid_id'; readonly id: string }
  | { readonly kind: 'duplicate'; readonly id: string };

const RAW_RE = /^classrup-[a-z0-9]+(?:-[a-z0-9]+)*:v[1-9][0-9]*$/;

/** Inventory check run in CI: ids well formed and unique, no prefix ambiguity, challenges fully bound. */
export function validateInventory(entries: readonly InventoryEntry[]): InventoryIssue[] {
  const issues: InventoryIssue[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.id)) issues.push({ kind: 'duplicate', id: e.id });
    seen.add(e.id);
    if ((e.kind === 'envelope' && !CONTEXT_PATTERN.test(e.id)) || (e.kind === 'raw' && !RAW_RE.test(e.id))) issues.push({ kind: 'invalid_id', id: e.id });
    if (e.kind === 'envelope' && e.leadingBytes !== envelopeLeadingBytes(e.id)) issues.push({ kind: 'invalid_id', id: e.id });
    if (e.kind === 'raw' && e.leadingBytes !== `${e.id}:`) issues.push({ kind: 'invalid_id', id: e.id });
    if (e.isChallenge) {
      const missing = (['audience', 'nonce', 'expiry'] as const).filter((k) => !e.challenge || !e.challenge[k]);
      if (missing.length > 0) issues.push({ kind: 'challenge_unbound', id: e.id, missing });
    }
  }
  for (const c of findPrefixConflicts(entries)) issues.push({ kind: 'prefix_conflict', ...c });
  return issues;
}
