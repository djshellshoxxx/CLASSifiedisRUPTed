/** Shared vocabulary and persisted record shapes for the moderation package. */
import type { Versioned } from '@classrup/kernel';

export const SUBJECT_TYPES = [
  'listing',
  'account',
  'message',
  'thread',
  'trade',
  'cycle',
  'auction',
  'booking',
  'rental',
  'federated_record',
] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const REPORT_REASONS = [
  'spam',
  'scam_fraud',
  'prohibited_item',
  'harassment',
  'hate',
  'violence',
  'sexual_content',
  'minor_safety',
  'impersonation',
  'privacy_violation',
  'counterfeit',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const ENFORCEMENT_ACTIONS = ['dismiss', 'warn', 'remove_content', 'restrict', 'suspend', 'ban'] as const;
export type EnforcementAction = (typeof ENFORCEMENT_ACTIONS)[number];

export const RESTRICTION_FEATURES = ['publishing', 'messaging', 'offers', 'bidding', 'trading'] as const;
export type RestrictionFeature = (typeof RESTRICTION_FEATURES)[number];

export type CaseStatus = 'open' | 'claimed' | 'pending_approval' | 'resolved';
export type ReportStatus = 'open' | 'closed';
export type EnforcementStatus = 'pending_approval' | 'rejected' | 'dismissed' | 'active' | 'expired' | 'reversed';
export type AppealStatus = 'submitted' | 'in_review' | 'decided';
export type AppealOutcome = 'upheld' | 'overturned' | 'modified';

export const EVIDENCE_KINDS = [
  'report',
  'message_excerpt',
  'screenshot_ref',
  'listing_snapshot',
  'transaction_ref',
  'decision',
  'appeal_outcome',
  'note',
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const SIGNAL_KINDS = [
  'payment_failed',
  'dispute_lost',
  'txhash_reuse',
  'rapid_account_creation',
  'report_upheld',
  'chargeback_claim',
  'spam_detected',
] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];

export interface ReportRecord extends Versioned {
  readonly tenantId: string;
  readonly reporterId: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly subjectAccountId?: string;
  readonly reason: ReportReason;
  readonly details: string;
  /** Decrypted excerpt attached by the reporter (message reports). Staff-only, never in DTOs for other roles. */
  readonly excerpt?: string;
  readonly caseId: string;
  /** Number of times the reporter submitted this report (duplicates are merged and counted). */
  readonly submissions: number;
  readonly status: ReportStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface CaseRecord extends Versioned {
  readonly tenantId: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly subjectAccountId?: string;
  readonly status: CaseStatus;
  readonly priority: number;
  readonly escalated: boolean;
  readonly reasonCounts: Readonly<Partial<Record<ReportReason, number>>>;
  /** Staff-only; never exposed to the subject. */
  readonly reporterIds: readonly string[];
  readonly submissionCount: number;
  readonly assigneeId?: string;
  readonly openedAt: number;
  readonly slaDueAt: number;
  readonly claimedAt?: number;
  readonly resolvedAt?: number;
  readonly resolution?: EnforcementAction;
  readonly updatedAt: number;
}

export interface ReporterStatsRecord extends Versioned {
  readonly upheld: number;
  readonly dismissed: number;
}

export interface EvidenceRecord extends Versioned {
  readonly caseId: string;
  readonly seq: number;
  readonly kind: EvidenceKind;
  readonly contentHash: string;
  readonly ref: string;
  readonly addedBy: string;
  readonly at: number;
  readonly prevHash: string;
  readonly hash: string;
}

export interface EvidenceHeadRecord extends Versioned {
  readonly hash: string;
  readonly count: number;
}

export interface EnforcementRecord extends Versioned {
  readonly tenantId: string;
  readonly caseId: string;
  readonly subjectType: SubjectType;
  readonly subjectId: string;
  readonly subjectAccountId?: string;
  readonly action: EnforcementAction;
  readonly policyClause: string;
  readonly reason: string;
  readonly durationMs?: number;
  readonly restriction?: RestrictionFeature;
  readonly status: EnforcementStatus;
  readonly deciderId: string;
  readonly approverId?: string;
  readonly rejectionReason?: string;
  readonly decidedAt: number;
  readonly appliedAt?: number;
  readonly expiresAt?: number;
  readonly appealDeadline?: number;
  readonly appealable: boolean;
  readonly requiresApproval: boolean;
  readonly appealId?: string;
  readonly replacesId?: string;
  readonly suspensionRecommended: boolean;
}

export interface AppealHistoryEntry {
  readonly at: number;
  readonly actorId: string;
  readonly from: AppealStatus | null;
  readonly to: AppealStatus;
  readonly note?: string;
}

export interface AppealRecord extends Versioned {
  readonly tenantId: string;
  readonly enforcementId: string;
  readonly caseId: string;
  readonly appellantId: string;
  readonly statement: string;
  readonly status: AppealStatus;
  readonly reviewerId?: string;
  readonly outcome?: AppealOutcome;
  readonly decisionNote?: string;
  readonly replacementId?: string;
  readonly createdAt: number;
  readonly decidedAt?: number;
  readonly history: readonly AppealHistoryEntry[];
}

export interface SignalRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly kind: SignalKind;
  readonly weight: number;
  readonly at: number;
  readonly sourceRef?: string;
  readonly revokedAt?: number;
}

export interface BlockRecord extends Versioned {
  readonly tenantId: string;
  readonly blockerId: string;
  readonly blockedId: string;
  readonly createdAt: number;
}

export interface BlockIndexRecord extends Versioned {
  readonly blockId: string;
}

export interface BucketRecord extends Versioned {
  /** Tokens scaled by the policy refill interval so refill arithmetic stays integral. */
  readonly units: number;
  readonly updatedAt: number;
}

export interface FingerprintRecord extends Versioned {
  readonly accountIds: readonly string[];
  readonly firstSeenAt: number;
  readonly lastSeenAt: number;
}

export interface PostActivityRecord extends Versioned {
  readonly stamps: readonly number[];
}
