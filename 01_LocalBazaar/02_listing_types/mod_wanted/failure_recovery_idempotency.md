# PS-007-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R09), CTR-ERR-001 (R03, R08), CTR-CAP-001 (R09), CTR-ID-001 (client IDs), CTR-SCH-001 (R05–R06 for offline commands).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-06.R01 | A mutation commits listing row, `revision` and outbox event in one transaction. No partial state. | MVP |
| PS-007-06.R02 | Retry with the same `idempotency_key` is safe for 7 days. | MVP |
| PS-007-06.R03 | Outbox delivery is at-least-once. Consumers dedupe on `event_id`. The sweeper is idempotent. | MVP |
| PS-007-06.R04 | Index projection lag p95 ≤ 60 s. Read-time guard hides expired posts immediately. | MVP |
| PS-007-06.R05 | Offline writes queue locally and show as "pending". They never show as "published" before relay acknowledgment (D08). | MVP |
| PS-007-06.R06 | Conflicting writes are never auto-merged. The second writer gets `SYS.CONFLICT` with current `revision`. | MVP |

## Data / schema
| Parameter | Default | Source |
|---|---|---|
| Command server timeout | 2 s | ASSUMPTION |
| Client retry | backoff 0.5 s × 2^n, ±20% jitter, max 5 attempts | ASSUMPTION |
| Idempotency record retention | 7 days | CTR-PRV RET-OPS |
| Sweeper interval, batch | 60 s, 500 rows | ASSUMPTION |
| Outbox retry | exponential to 15 min cap; dead-letter after 24 h | ASSUMPTION |
| Offline queue TTL | 14 days, then discarded with local notice | ASSUMPTION |

## Commands / queries / events
No new commands. Recovery replays `listing.*` events from the outbox. Event immutability (CTR-EVT R08) means replay never edits history.

## States & transitions
Offline item lifecycle: `local_pending` → `sent` → `acknowledged` | `rejected` (server code) | `expired_locally` (TTL). Server states are in PS-007-03.

## Validation & errors
On flush, the server returns the normal code (for example `WANTED.EXPIRY_OUT_OF_RANGE` or `SYS.CONFLICT`). Clients show the server code, not a generic error.

## Authorization
Authorization is re-checked on every attempt. No cached write authorization (CTR-CAP R09).

## Failure, idempotency, concurrency, offline
- Crash after commit, before projection: outbox replays on restart; projection applies once.
- Timeout: client retries with same key; server returns original result.
- Concurrent edits: CAS on `revision`; one wins, the other gets `SYS.CONFLICT`.
- Moderation race: suspension wins. Owner writes during suspension return `SUSPENDED_READ_ONLY`.
- Expiry during offline queue: flush is rejected; the local copy never reports "published".
- Outbox dead-letter after 24 h: alert and runbook. No silent drop.
- Local drafts are stored encrypted on device and cleared on logout (ASSUMPTION).

## Privacy, retention, abuse
Pending local drafts are PRIVATE_PERSONAL and stay on device until acknowledged. Queue entries hold no secrets.

## Observability & budgets
Gauges `wanted_outbox_lag_seconds`, `wanted_dead_letter_total`; histogram `wanted_offline_queue_age_seconds`. Alert on dead-letter > 0 for 15 min.

## Tests
- TEST-PS-007-06-01 (integration): kill process after commit, before projection; event delivered once after restart.
- TEST-PS-007-06-02 (chaos): `listing.published` delivered 3×; projection holds one row.
- TEST-PS-007-06-03 (integration): two clients update `revision` 3; one gets 4, the other `SYS.CONFLICT`.
- TEST-PS-007-06-04 (e2e offline): airplane mode create and pause; reconnect; flush once; no duplicate.
- TEST-PS-007-06-05 (integration): post expires while queued; flush rejected; UI never shows "published".

## Acceptance criteria
1. Zero duplicate listings over 100 injected retries.
2. No "published" label rendered before acknowledgment.
3. Duplicate sweeper runs are no-ops.
4. Dead-letter alert and runbook exist before MVP.

## Assumptions & open decisions
- D08 PROVISIONAL (Dxx default, unapproved): local pending queue until authenticated relay acknowledgment.
- D04 PROVISIONAL (Dxx default, unapproved): no atomic guarantee; recovery is per-aggregate compensation only.
- ASSUMPTION: all timing and retry values above.
