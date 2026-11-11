// Ports that reach storage by inverted registration at composition (PS-119): the F15.S04.M03 TenantPort
// limits and the relay's F10.S02.M03 verifyImageClean. Their owners' error codes pass through unchanged.
import type { AppError } from '../errors/app-error.ts';
import type { Result } from '../errors/result.ts';

/** Where a store runs: in the user's vault (IndexedDB, or memory in tests) or on a relay (SQLite, or memory in tests). */
export type StorageSite = 'vault' | 'relay';

/** Relay tenant limits read by storage (F15.S04.M03 limits(tenantId)); every value is capped at the platform maximum. */
export interface TenantLimits {
  readonly maxUploadBytes?: number;
}

/** Vault LocalSettings.localLimits read by storage (F15.S04.M03). */
export interface LocalLimits {
  readonly maxLocalAttachmentBytes?: number;
}

/**
 * The limit side of the F15.S04.M03 TenantPort as storage reads it: limits(tenantId) on a relay and
 * localLimits() in the vault. Without a registered port the platform maximum of 5 MiB applies.
 */
export interface TenantLimitsPort {
  limits?(tenantId: string): TenantLimits | undefined;
  localLimits?(): LocalLimits | undefined;
}

/**
 * F10.S02.M03 verifyImageClean as the relay composition registers it: ok when the image carries no GPS or
 * identifying metadata, otherwise the owner's error (PRIVACY_METADATA_GPS_PRESENT), returned unchanged.
 * It receives a copy of the bytes; storage stores exactly the received bytes and never re-encodes them.
 */
export interface ImageVerifier {
  verifyImageClean(bytes: Uint8Array, contentType: string): Result<void, AppError> | Promise<Result<void, AppError>>;
}

export type BlobPutOutcome = 'stored' | 'duplicate' | 'rejected';

/** Observation of one blob put for metrics and the blob.rejected log line: never bytes, refs or tenants. */
export interface BlobPutEvent {
  readonly outcome: BlobPutOutcome;
  readonly code: string;
  readonly size: number;
  readonly contentType: string;
}
