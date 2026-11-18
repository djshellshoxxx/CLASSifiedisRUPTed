# PS-025-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R04, R12), CTR-EVT-001 (R03), CTR-SCH-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-06.R01 | Quote refresh always creates a new cycle version; no existing binding is re-pinned silently. | MVP |
| PS-025-06.R02 | Quote owner unavailable: pin fails with COM.VERIFIER_UNAVAILABLE upstream; no binding is created. | MVP |
| PS-025-06.R03 | Rounding is HALF_EVEN on minor units and replays identically (golden fixtures). | MVP |
| PS-025-06.R04 | Pin retried with same key returns original binding. | MVP |
| PS-025-06.R05 | Timeout 3 s; backoff 1 s base, 60 s cap, 5 attempts (ASSUMPTION). | MVP |

## Data / schema
Binding history retained; quote bytes retained as received (CTR-SCH-001 R08).

## Commands / queries / events
Pin is retry-safe by key.

## States & transitions
Failure edges per PS-025-03.

## Validation & errors
Upstream failure surfaces as CYCCURR.QUOTE_REQUIRED (retryable).

## Authorization
Retries re-check system grant.

## Failure, idempotency, concurrency, offline
- Race: two refreshes for one version serialise; second returns the first's result if same quote, else conflict.
- Crash after quote read: binding not created; pin retried.
- Offline: consent with cross-currency terms requires online quote check; pending-ack only (D08).

## Privacy, retention, abuse
Pending local terms purged on logout.

## Observability & budgets
Count of quote-blocked consents per hour.

## Tests
- TEST-PS-025-06-01 (property): rounding golden fixtures replay identically.
- TEST-PS-025-06-02 (integration): refresh creates new version and clears consents.
- TEST-PS-025-06-03 (fault): quote owner down blocks pin with no partial binding.

## Acceptance criteria
1. Zero silent re-pins in 100% of runs.
2. Rounding fixtures match stored results exactly.
3. No binding exists without a successful upstream quote read.

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved).
- PROVISIONAL (D08 default, unapproved).
