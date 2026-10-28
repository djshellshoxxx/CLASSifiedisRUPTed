/**
 * CTR-PRV-001 (owner F10): disclosure, location and retention classes.
 * Every persisted field that is not `public` must be filtered before leaving its owner.
 */
export type DisclosureClass =
  /** Safe for public listing/search/federation payloads. */
  | 'public'
  /** Visible to counterparties of a specific trade/thread only. */
  | 'participants'
  /** Visible only to the owner (and operators under legal process). */
  | 'private'
  /** Never leaves the device / secret store (keys, recovery codes). */
  | 'secret';

/**
 * Location precision ladder (ADR-0006). Public payloads may carry at most `region`.
 * `exact` is only ever disclosed by explicit user action to named participants.
 */
export type LocationPrecision = 'none' | 'country' | 'city' | 'region' | 'neighbourhood' | 'exact';

export const LOCATION_PRECISION_ORDER: readonly LocationPrecision[] = ['none', 'country', 'city', 'region', 'neighbourhood', 'exact'];

/** Max precision allowed in public/federated payloads. */
export const PUBLIC_MAX_PRECISION: LocationPrecision = 'region';

export const precisionRank = (p: LocationPrecision): number => LOCATION_PRECISION_ORDER.indexOf(p);

export type RetentionClass =
  | 'ephemeral' // minutes-hours: rate-limit counters, nonces
  | 'session' // until session end + short grace
  | 'content' // user content: until deletion request or expiry
  | 'commerce_evidence' // append-only trade/settlement evidence: policy-driven multi-year
  | 'moderation' // reports, decisions, appeals
  | 'audit' // security/audit logs
  | 'legal_hold'; // frozen; deletion blocked until hold released
