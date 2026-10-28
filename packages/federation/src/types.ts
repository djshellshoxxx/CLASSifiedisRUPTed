/** Wire formats and persisted records of the federation area. */
import type { Versioned } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';

export const RECORD_TYPES = ['listing.public', 'profile.public', 'tombstone', 'moderation.label'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

/** FederatedRecord envelope v1: the unit that is signed by its author key. */
export interface FederatedRecord {
  readonly v: 1;
  readonly type: RecordType;
  readonly recordId: string;
  readonly revision: number;
  readonly authorKeyId: string;
  readonly originRelay: string;
  readonly createdAt: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly prevHash?: string;
}

/** A record with the author's signature and, once published, the origin relay's countersignature. */
export interface FederatedEnvelope {
  readonly record: FederatedRecord;
  readonly authorSig: string;
  readonly relayKeyId?: string;
  readonly relaySig?: string;
}

export interface FederationBatch {
  readonly v: 1;
  /** Single-use nonce for replay protection. */
  readonly batchId: string;
  readonly from: string;
  readonly sentAt: number;
  readonly records: readonly FederatedEnvelope[];
}

export type SignedBatch = SignedEnvelope<FederationBatch>;

export interface MigrationStatement {
  readonly fromRelay: string;
  readonly toRelay: string;
  readonly oldKeyId: string;
  readonly newKeyId: string;
  readonly at: number;
}

export interface MigrationProof {
  readonly statement: MigrationStatement;
  readonly oldSig: string;
  readonly newSig: string;
}

export type RecordState = 'active' | 'tombstoned';

export interface StoredRecord extends Versioned {
  readonly tenantId: string;
  readonly originRelay: string;
  readonly recordId: string;
  readonly type: RecordType;
  readonly revision: number;
  readonly authorKeyId: string;
  /** Set for locally published records: the account that signed with its key. */
  readonly authorAccountId?: string;
  readonly contentHash: string;
  readonly envelope: FederatedEnvelope;
  readonly state: RecordState;
  readonly source: 'local' | 'inbound';
  readonly receivedFrom?: string;
  readonly redirectTo?: { readonly toRelay: string; readonly newKeyId: string };
  readonly receivedAt: number;
}

export interface FederationMark extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly federate: boolean;
  readonly updatedAt: number;
}

export type DeliveryStatus = 'pending' | 'sent' | 'dead' | 'cancelled';

export interface Delivery extends Versioned {
  readonly tenantId: string;
  readonly peerId: string;
  readonly recordKey: string;
  readonly recordId: string;
  readonly revision: number;
  readonly envelope: FederatedEnvelope;
  readonly status: DeliveryStatus;
  readonly attempts: number;
  readonly nextAttemptAt: number;
  readonly lastResult?: 'retry' | 'rejected' | 'error';
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type PeerStatus = 'pending' | 'trusted' | 'suspended' | 'blocked';

export interface PeerLimits {
  readonly recordsPerMinute: number;
  readonly dailyByteQuota: number;
}

export interface Peer extends Versioned {
  readonly tenantId: string;
  readonly relayId: string;
  readonly name?: string;
  /** Pinned Ed25519 key. Changes only through an explicit admin key rotation, which resets trust to pending. */
  readonly publicKeyId: string;
  readonly status: PeerStatus;
  readonly limits: PeerLimits;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** Counters live apart from the Peer so admin edits never conflict with traffic. */
export interface PeerStats extends Versioned {
  readonly tenantId: string;
  readonly accepted: number;
  readonly rejected: number;
  readonly duplicates: number;
  readonly consecutiveRejections: number;
  readonly rejectionsByReason: Readonly<Record<string, number>>;
  readonly minuteStart: number;
  readonly minuteRecords: number;
  readonly dayStart: number;
  readonly dayBytes: number;
}

export interface SeenMarker extends Versioned {
  readonly tenantId: string;
  readonly seenAt: number;
}

export interface NonceRow extends Versioned {
  readonly expiresAt: number;
}

export type ConflictKind = 'rollback' | 'fork' | 'tombstone_override' | 'author_mismatch';

export interface ConflictRecord extends Versioned {
  readonly tenantId: string;
  readonly recordKey: string;
  readonly kind: ConflictKind;
  readonly winner: 'incoming' | 'existing';
  readonly existingRevision: number;
  readonly existingHash: string;
  readonly incomingRevision: number;
  readonly incomingHash: string;
  readonly peerId?: string;
  readonly at: number;
}

export type BlockKind = 'peer' | 'domain' | 'author_key';
export type BlockStatus = 'active' | 'pending_review' | 'rejected' | 'revoked';

export interface BlockEntry extends Versioned {
  readonly tenantId: string;
  readonly kind: BlockKind;
  readonly value: string;
  readonly reason: string;
  readonly status: BlockStatus;
  readonly source: 'local' | 'imported';
  readonly importedFrom?: string;
  readonly createdBy: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface MigrationRow extends Versioned {
  readonly tenantId: string;
  readonly statement: MigrationStatement;
  readonly oldSig: string;
  readonly newSig: string;
  readonly source: 'account' | 'admin' | 'peer';
  readonly redirected: number;
  readonly createdAt: number;
}
