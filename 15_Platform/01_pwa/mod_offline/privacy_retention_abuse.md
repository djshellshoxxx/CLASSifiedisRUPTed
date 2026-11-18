# PS-116-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-07.R01 | Payloads are encrypted at rest on the device with AES-256-GCM; key is non-extractable (Web Crypto) where the platform allows. Library and version pinned in an ADR (OPEN). | MVP |
| PS-116-07.R02 | Queue is enabled only after the user opts in to local cache (CTR-PRV-001). Default: off for PRIVATE_PERSONAL and LOCATION_PRECISE. | MVP |
| PS-116-07.R03 | Logout and account switch purge caches and entries of the previous account after confirmation (CTR-PRV-001 S3-10). | MVP |
| PS-116-07.R04 | Purge on `applied` and `discarded` in the same transaction (PS-116-03 R02). | MVP |
| PS-116-07.R05 | Deletion completion record for user discard contains entry count and timestamp only, no payload or command type (CTR-PRV-001 R12). | MVP |
| PS-116-07.R06 | Queue entries never appear in telemetry, crash reports or support exports. | MVP |
| PS-116-07.R07 | Abuse: queue cap (PS-116-01 R04) and enqueue rate of 60 per minute per account (ASSUMPTION). | MVP |

## Data / schema
Retention class RET-EPH for ciphertext of pending entries: kept until applied, discarded or expired. Discard completion record: `{"entries": int, "at": ms}`.

## Commands / queries / events
No CTR-EVT-001 events are emitted by this module. Deletion completion is a local record only.

## States & transitions
Retention ends at the `applied`, `discarded` or `not_applied`-after-expiry transitions in PS-116-03.

## Validation & errors
`OFFLINE.RATE_LIMITED` is not used; enqueue uses `SYS.RATE_LIMITED` (retryable, `retry_after_ms`).

## Authorization
Only the device owner reads ciphertext. Export (CTR-PRV-001 R11) does not include the queue.

## Failure, idempotency, concurrency, offline
Loss of the device key makes ciphertext unreadable; entries are shown as `not_applied` with `OFFLINE.KEY_UNAVAILABLE` and must be re-created by the user (PROVISIONAL, D10 OPEN).

## Privacy, retention, abuse
Shared-device risk: account switch and idle lock clear in-memory keys. No geolocation is captured by this module.

## Observability & budgets
Metrics count only: `offline_purged_total{reason}`. No identifiers.

## Tests
- TEST-PS-116-07-01 (unit): stored IndexedDB records contain no plaintext payload (scan fixture strings).
- TEST-PS-116-07-02 (integration): account switch purges previous account entries after confirmation.
- TEST-PS-116-07-03 (e2e): LOCATION_PRECISE command is refused when local cache is off.
- TEST-PS-116-07-04 (negative): telemetry capture during failures contains no fixture payload.

## Acceptance criteria
1. No plaintext payload in device storage (TEST-01).
2. Caches cleared on logout (TEST-02).
3. TEST-PS-116-07-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 60 enqueues per minute per account.
- PROVISIONAL (D07 default): minimal retention with legal-hold exceptions; device queues are not subject to legal hold.
- OPEN (D10): recovery of device key.
