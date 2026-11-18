# PS-038-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_sniping. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-038-09.R01 | Contract tests validate `sniping.*` events against CTR-EVT-001 and error bodies against CTR-ERR-001 in CI. | MVP |
| PS-038-09.R02 | Boundary fixtures at 9.999 s, 10 s, 120 s and close-1 ms for classification. | MVP |
| PS-038-09.R03 | Offline fixtures: bid queued 0 s, 90 s and 10 min before ack. | MVP |
| PS-038-09.R04 | Zero bidder_id in non-F12 outputs across the fixture corpus. | MVP |

## Data / schema
Synthetic bids with `acc_`/`bid_` fixture IDs; synthetic clock traces.

## Commands / queries / events
Consumer-driven contracts for `sniping.bid_classified`, `sniping.bid_rejected_after_close`, `sniping.clock_*`.

## States & transitions
Scenario walks: RECEIVED to ACCEPTED_IN_ORDER; RECEIVED to REJECTED_AFTER_CLOSE; DEGRADED round-trip.

## Validation & errors
Negative fixtures per SNIPE.* code.

## Authorization
Negative tests per capability row (PS-038-05).

## Failure, idempotency, concurrency, offline
Chaos: classifier outage, duplicate delivery, NTP loss (PS-038-06).

## Privacy, retention, abuse
Lint and redaction tests (PS-038-07, PS-038-08).

## Observability & budgets
Assert counters increment in each fixture.

## Tests
- TEST-PS-038-09-01 (contract): event envelope validates.
- TEST-PS-038-09-02 (boundary): R02 fixtures classify exactly as specified.
- TEST-PS-038-09-03 (offline e2e): queued bid acknowledged at 10 min is server-classified.
- TEST-PS-038-09-04 (a11y): bid timing feedback message readable by screen reader and not color-only (F14).

## Acceptance criteria
1. Contract suite green.
2. All boundary fixtures pass.
3. Zero leaks in corpus.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures are sufficient for planning.
- PROVISIONAL (D08 default, unapproved): offline fixtures reflect pending-queue model.
