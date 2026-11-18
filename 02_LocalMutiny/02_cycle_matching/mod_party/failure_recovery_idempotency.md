# PS-019-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-06.R01 | Two concurrent binds of one participant into two cycles: exactly one succeeds; the other returns CYCPARTY.SLOT_TAKEN. | MVP |
| PS-019-06.R02 | Withdrawal after consent but before lock is allowed, supersedes the cycle version, and clears other consents. | MVP |
| PS-019-06.R03 | Replayed bind or withdraw with same key returns original result, no new event. | MVP |
| PS-019-06.R04 | Command timeout 3 s; retry only with the same key. | MVP |
| PS-019-06.R05 | Offline withdrawal is queued as pending until relay acknowledgement (D08); not applied locally as final. | MVP |

## Data / schema
Live-slot unique constraint; version counter.

## Commands / queries / events
All writes retry-safe by key.

## States & transitions
Failure edges in PS-019-03.

## Validation & errors
Stale version returns CYCPARTY.VERSION_STALE (retryable).

## Authorization
Retries re-check participant status.

## Failure, idempotency, concurrency, offline
- Race: bind and withdraw of the same slot serialise on version.
- Crash after bind commit: binding exists; recovery reads committed state.
- Backoff: 1 s base, 60 s cap, 5 attempts (ASSUMPTION).

## Privacy, retention, abuse
Pending local withdrawals are purged on logout.

## Observability & budgets
Count of SLOT_TAKEN per hour (possible double-booking attempts).

## Tests
- TEST-PS-019-06-01 (concurrency): 100 parallel binds yield one live slot per participant.
- TEST-PS-019-06-02 (integration): withdrawal after consent supersedes version.
- TEST-PS-019-06-03 (offline): queued withdrawal applies once after ack.

## Acceptance criteria
1. Zero participants with two live slots in 100% of runs.
2. Superseded versions never reach lock.
3. Replays create no duplicate events.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved).
- PROVISIONAL (D04 default, unapproved).
