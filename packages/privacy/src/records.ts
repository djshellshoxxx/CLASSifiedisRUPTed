import type { Collection, Deps, JsonValue, RetentionClass, Versioned } from '@classrup/kernel';

export const CONSENT_PURPOSES = ['analytics', 'federation', 'notifications_email', 'notifications_push', 'location_precise', 'marketing'] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
export type ConsentDecision = 'granted' | 'withdrawn';

/** Append-only history: one immutable record per grant or withdrawal. */
export interface ConsentEntryRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly purpose: ConsentPurpose;
  readonly decision: ConsentDecision;
  readonly policyVersion: string;
  readonly at: number;
}

/** Current decision per (account, purpose); id is `<accountId>:<purpose>`. */
export interface ConsentStateRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly purpose: ConsentPurpose;
  readonly decision: ConsentDecision;
  readonly policyVersion: string;
  readonly since: number;
  readonly entryId: string;
}

/** Per-tenant overrides of the retention defaults; id is the tenant id. */
export interface RetentionPolicyRecord extends Versioned {
  readonly overrides: Readonly<Partial<Record<RetentionClass, number>>>;
  readonly updatedAt: number;
  readonly updatedBy: string;
}

export interface HoldRecord extends Versioned {
  readonly tenantId: string;
  readonly subjectType: 'account' | 'record';
  readonly subjectId: string;
  /** Short operator note. Must not contain personal data. */
  readonly reason: string;
  readonly status: 'active' | 'released';
  readonly placedBy: string;
  readonly placedAt: number;
  readonly releasedBy?: string;
  readonly releasedAt?: number;
}

export type ExportStatus = 'requested' | 'available' | 'failed' | 'expired';

export interface ExportManifest {
  readonly exportId: string;
  readonly accountId: string;
  readonly formatVersion: 1;
  readonly generatedAt: number;
  readonly availableUntil: number;
  readonly sections: readonly { readonly area: string; readonly contentHash: string }[];
  /** Hash over the ordered section hashes, so a bundle can be checked as a whole. */
  readonly bundleHash: string;
}

export interface ExportRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly status: ExportStatus;
  readonly requestedAt: number;
  readonly availableUntil?: number;
  readonly manifest?: ExportManifest;
  /** Personal data. Dropped when the export expires. */
  readonly sections?: Readonly<Record<string, JsonValue>>;
  readonly failedAreas?: readonly string[];
  readonly downloads: number;
}

export type DeletionStatus = 'requested' | 'grace' | 'executing' | 'completed' | 'blocked_by_hold' | 'failed' | 'cancelled';

export interface RetainedItem {
  readonly area: string;
  readonly item: string;
  readonly retentionClass: RetentionClass | null;
  readonly reason: string;
}

export interface DeletionReport {
  readonly areas: readonly { readonly area: string; readonly erased: number; readonly retained: readonly string[] }[];
  readonly retained: readonly RetainedItem[];
}

export interface DeletionRecord extends Versioned {
  readonly tenantId: string;
  readonly accountId: string;
  readonly status: DeletionStatus;
  readonly requestedAt: number;
  readonly graceEndsAt: number;
  readonly blockedByHoldIds?: readonly string[];
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly cancelledAt?: number;
  readonly failedArea?: string;
  readonly failureCode?: string;
  readonly report?: DeletionReport;
}

export interface PrivacyStores {
  readonly consentLog: Collection<ConsentEntryRecord>;
  readonly consentState: Collection<ConsentStateRecord>;
  readonly retention: Collection<RetentionPolicyRecord>;
  readonly holds: Collection<HoldRecord>;
  readonly exports: Collection<ExportRecord>;
  readonly deletions: Collection<DeletionRecord>;
}

export const COLLECTIONS = {
  consentLog: 'privacy_consent_entries',
  consentState: 'privacy_consent_states',
  retention: 'privacy_retention_policies',
  holds: 'privacy_holds',
  exports: 'privacy_exports',
  deletions: 'privacy_deletions',
} as const;

export function openStores(deps: Pick<Deps, 'store'>): PrivacyStores {
  const c = deps.store.collection.bind(deps.store);
  return {
    consentLog: c(COLLECTIONS.consentLog),
    consentState: c(COLLECTIONS.consentState),
    retention: c(COLLECTIONS.retention),
    holds: c(COLLECTIONS.holds),
    exports: c(COLLECTIONS.exports),
    deletions: c(COLLECTIONS.deletions),
  };
}
