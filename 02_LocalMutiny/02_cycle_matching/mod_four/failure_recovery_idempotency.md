# PS-017-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-SCH-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-06.R01 | A consent for version v cannot advance version v+1 (checked against expected_version). | MVP |
| PS-017-06.R02 | Duplicate consent with same key returns the original response with no new event. | MVP |
| PS-017-06.R03 | If mod_lock fails after `consented`, the cycle returns to `proposed` with consents cleared; no partial lock remains. | MVP |
| PS-017-06.R04 | Timeouts: command 3 s; retry only with same key; backoff 1 s base, 60 s cap, 5 attempts (ASSUMPTION). | MVP |
| PS-017-06.R05 | Expiry job runs every 1 min; consent on an expired cycle returns SYS.UNPROCESSABLE_STATE. | MVP |

## Data / schema
Version counter and consent flags; idempotency records 7 days.

## Commands / queries / events
All writes retry-safe by key.

## States & transitions
Failure edges are in PS-017-03 (lock failure, expiry).

## Validation & errors
Expired consent returns SYS.UNPROCESSABLE_STATE; stale version returns SYS.CONFLICT.

## Authorization
Retries re-check participant status.

## Failure, idempotency, concurrency, offline
- Race: two slots consent in parallel; both commits serialise on version; the last one completes `consented`.
- Crash mid-commit: event append is atomic with state change; recovery reads last revision.
- Offline: consent is never queued as a blind action; a pending-ack state is shown until relay acknowledgement (D08).

## Privacy, retention, abuse
Pending local consents are purged on logout (CTR-PRV-001 R06).

## Observability & budgets
Count of lock failures and supersessions per day.

## Tests
- TEST-PS-017-06-01 (concurrency): four parallel consents yield one consented event.
- TEST-PS-017-06-02 (integration): mod_lock failure clears consents.
- TEST-PS-017-06-03 (offline): queued consent sent after version change is rejected.

## Acceptance criteria
1. No consented state from mixed versions in 100% of runs.
2. Zero duplicate events for replayed keys.
3. Expiry within 1 min of the 48 h window.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated acknowledgement.
- ASSUMPTION: timeout and retry values above.
