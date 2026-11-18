# PS-020-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-06.R01 | Two of three consent, third declines: the cycle is declined and both consents are released; no lock. | MVP |
| PS-020-06.R02 | Consent for version v never advances version v+1. | MVP |
| PS-020-06.R03 | Same-key replay returns original result with no new event. | MVP |
| PS-020-06.R04 | Command timeout 3 s; backoff 1 s base, 60 s cap, 5 attempts (ASSUMPTION). | MVP |
| PS-020-06.R05 | Lock-time listing re-check fails (CYCTHREE.LISTING_LOCKED): cycle returns to proposed and is not locked. | MVP |

## Data / schema
Version counter; idempotency records 7 days.

## Commands / queries / events
All writes retry-safe by key.

## States & transitions
Failure edges in PS-020-03.

## Validation & errors
Stale version returns SYS.CONFLICT.

## Authorization
Retries re-check participant status.

## Failure, idempotency, concurrency, offline
- Race: three consents in parallel serialise on version; exactly one final `consented`.
- Crash mid-consent: committed state is authoritative on restart.
- Offline: consent queued as pending-ack only (D08).

## Privacy, retention, abuse
Pending local consents purged on logout.

## Observability & budgets
Count of lock re-check failures.

## Tests
- TEST-PS-020-06-01 (concurrency): three parallel consents yield one consented event.
- TEST-PS-020-06-02 (integration): two consents then decline releases both.
- TEST-PS-020-06-03 (integration): listing locked between proposal and lock blocks lock.

## Acceptance criteria
1. No lock without three consents on one version in 100% of runs.
2. Declines release all slots in 100% of runs.
3. Zero duplicate events on replay.

## Assumptions & open decisions
- PROVISIONAL (D04 default, unapproved).
- PROVISIONAL (D08 default, unapproved).
