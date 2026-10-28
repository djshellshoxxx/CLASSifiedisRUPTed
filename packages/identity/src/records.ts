/** Persisted record shapes and typed collection access. Records never leave the package: DTOs do. */
import type { AccountStatus, Collection, Deps, Role, Versioned } from '@classrup/kernel';

export type Visibility = 'public' | 'participants' | 'private';
export const PROFILE_FIELDS = ['displayName', 'bio', 'avatarRef', 'languages', 'regionCell'] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export interface DeviceEntry {
  readonly id: string;
  readonly signingKeyId: string;
  readonly boxKeyId: string;
  readonly label?: string;
  readonly status: 'active' | 'revoked';
  readonly addedAt: number;
  readonly revokedAt?: number;
}

export interface AccountRecord extends Versioned {
  readonly tenantId: string;
  readonly pseudonym: string;
  readonly pseudonymKey: string;
  readonly status: AccountStatus;
  readonly roles: readonly Role[];
  readonly devices: readonly DeviceEntry[];
  /** Incremented on every device change; signed key-rotation requests commit to it (replay defence). */
  readonly keyEpoch: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PseudonymIndexRecord extends Versioned {
  readonly accountId: string;
}

export interface ChallengeRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly signingKeyId: string;
  readonly nonce: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly usedAt?: number;
}

export interface SessionRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly deviceId: string;
  readonly signingKeyId: string;
  /** Hash only; the bearer token is shown once at login. */
  readonly tokenHash: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly idleExpiresAt: number;
  readonly lastSeenAt: number;
  readonly revokedAt?: number;
  readonly revokedReason?: 'logout' | 'revoked' | 'recovery' | 'device_revoked' | 'account_status' | 'expired' | 'erased';
}

export interface RecoveryCodeEntry {
  readonly hash: string;
  readonly usedAt?: number;
}

/** One record per account (id derived from the account id); reissuing replaces the whole set. */
export interface RecoverySetRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly codes: readonly RecoveryCodeEntry[];
  readonly issuedAt: number;
}

export interface ImportEntry {
  readonly documentHash: string;
  readonly sourcePseudonym: string;
  readonly signingKeyId: string;
  readonly importedAt: number;
}

export interface ProfileRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly avatarRef?: string;
  readonly languages: readonly string[];
  readonly regionCell?: string;
  readonly visibility: Readonly<Record<ProfileField, Visibility>>;
  readonly imports: readonly ImportEntry[];
  readonly updatedAt: number;
}

export interface FeedbackRecord extends Versioned {
  readonly tenantId: string;
  readonly raterId: string;
  readonly rateeId: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly rating: number;
  readonly comment?: string;
  readonly status: 'active' | 'removed';
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface FeedbackIndexRecord extends Versioned {
  readonly feedbackId: string;
}

export interface ReputationRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly count: number;
  readonly sum: number;
  /** histogram[i] = number of active ratings equal to i + 1. */
  readonly histogram: readonly [number, number, number, number, number];
}

export type EvidenceLevel = 'self_attested' | 'verified';
export type EvidenceStatus = 'active' | 'revoked' | 'expired';

export interface EvidenceRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly kind: string;
  readonly level: EvidenceLevel;
  readonly status: EvidenceStatus;
  /** Owner-visible note for self-attested claims. Never shown publicly. */
  readonly note?: string;
  readonly attesterKeyId?: string;
  /** Hash of the signed attestation envelope; the underlying documents are never stored. */
  readonly attestationHash?: string;
  readonly issuedAt: number;
  readonly expiresAt?: number;
  readonly revokedAt?: number;
  readonly revokedReason?: string;
}

export interface AttesterRecord extends Versioned {
  readonly tenantId: string;
  readonly keyId: string;
  readonly label: string;
  readonly kinds: readonly string[];
  readonly status: 'active' | 'revoked';
  readonly registeredBy: string;
  readonly registeredAt: number;
  readonly revokedAt?: number;
}

export interface IdentityStores {
  readonly accounts: Collection<AccountRecord>;
  readonly pseudonyms: Collection<PseudonymIndexRecord>;
  readonly challenges: Collection<ChallengeRecord>;
  readonly sessions: Collection<SessionRecord>;
  readonly recovery: Collection<RecoverySetRecord>;
  readonly profiles: Collection<ProfileRecord>;
  readonly feedback: Collection<FeedbackRecord>;
  readonly feedbackIndex: Collection<FeedbackIndexRecord>;
  readonly reputation: Collection<ReputationRecord>;
  readonly evidence: Collection<EvidenceRecord>;
  readonly attesters: Collection<AttesterRecord>;
}

export const COLLECTIONS = {
  accounts: 'identity_accounts',
  pseudonyms: 'identity_pseudonyms',
  challenges: 'identity_challenges',
  sessions: 'identity_sessions',
  recovery: 'identity_recovery_sets',
  profiles: 'identity_profiles',
  feedback: 'identity_feedback',
  feedbackIndex: 'identity_feedback_index',
  reputation: 'identity_reputations',
  evidence: 'identity_evidence',
  attesters: 'identity_attesters',
} as const;

export function openStores(deps: Pick<Deps, 'store'>): IdentityStores {
  const c = deps.store.collection.bind(deps.store);
  return {
    accounts: c(COLLECTIONS.accounts),
    pseudonyms: c(COLLECTIONS.pseudonyms),
    challenges: c(COLLECTIONS.challenges),
    sessions: c(COLLECTIONS.sessions),
    recovery: c(COLLECTIONS.recovery),
    profiles: c(COLLECTIONS.profiles),
    feedback: c(COLLECTIONS.feedback),
    feedbackIndex: c(COLLECTIONS.feedbackIndex),
    reputation: c(COLLECTIONS.reputation),
    evidence: c(COLLECTIONS.evidence),
    attesters: c(COLLECTIONS.attesters),
  };
}
