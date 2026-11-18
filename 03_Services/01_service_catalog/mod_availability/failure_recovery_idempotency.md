# PS-028-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-06.R01 | Two concurrent holds on a capacity-1 window: exactly one succeeds, the other returns `SYS.CONFLICT` with no write. | MVP |
| PS-028-06.R02 | Hold expiry runs every 60 s; an expired hold releases capacity within 90 s of `hold_expires_at`. | MVP |
| PS-028-06.R03 | Hold-and-book is never partial: hold release and booking link commit in one transaction. | MVP |
| PS-028-06.R04 | Offline provider edits are queued (D08) and validated on acknowledgement; conflicting edits return `SYS.CONFLICT` and are not merged silently. | MVP |
| PS-028-06.R05 | Server time is the authority for hold expiry; client clocks are not trusted. | MVP |

## Data / schema
Idempotency record per (actor, command, key, digest). Hold key (`svq_`, `avw_`) unique.

## Commands / queries / events
Retries use same key. Expiry emits `svcavail.hold.expired` once per hold.

## States & transitions
Recovery never moves BOOKED to OPEN without a `booking_released` event (PS-028-03 R03).

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED`. Non-retryable: `SYS.CONFLICT` on revision change (client must re-read), validation codes.

## Authorization
Expiry timer runs as `sys`.

## Failure, idempotency, concurrency, offline
- Client timeout: retry with same key, up to 5 attempts, jittered backoff 1–30 s.
- Timer missed (process restart): next run catches all expired holds; idempotent.
- Calendar import partial failure: whole import rolled back (PS-028-02 R07).
- Offline: pending queue shown with "not yet saved" state; never displayed as bookable.

## Privacy, retention, abuse
Recovery logs contain window and hold IDs only. Pending queue items encrypted at rest on device (ASSUMPTION).

## Observability & budgets
Metrics: `svcavail_hold_expiry_lag_seconds` p95 ≤ 90 s; `svcavail_conflict_total`; `svcavail_pending_queue_age_seconds`.

## Tests
- TEST-PS-028-06-01 (concurrency): 100 parallel holds, capacity 1 → exactly one HELD.
- TEST-PS-028-06-02 (fault): kill process during hold-and-book → no half state (verified by reconciliation).
- TEST-PS-028-06-03 (timer): restart 10 min after expiry → all holds released once.
- TEST-PS-028-06-04 (offline): edit queued while window booked; ack returns conflict; no overwrite.

## Acceptance criteria
1. Double-booking count is zero in the fault suite.
2. Expiry lag stays within R02 under 1,000 holds.
3. No offline edit is applied to a BOOKED window.

## Assumptions & open decisions
- ASSUMPTION: 60 s timer interval; 72 h hold TTL.
- PROVISIONAL: offline writes pending until server acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
