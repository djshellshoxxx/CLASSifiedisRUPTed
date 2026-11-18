# PS-075-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Tests 01, 09), CTR-EVT-001, CTR-SCH-001, CTR-ERR-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-09.R01 | CTR-COM-001 test 09 (quote expiry, HALF_EVEN golden vectors) passes against this module. | MVP |
| PS-075-09.R02 | Recorded source responses replayed in CI; no live source calls in CI. | MVP |
| PS-075-09.R03 | Every RATE.* code has one contract test. | MVP |
| PS-075-09.R04 | Accessibility: quote display shows base, quote, rate and expiry in text, not colour alone. | MVP |

## Data / schema
Fixtures: recorded source observations (synthetic), pair registry snapshot.

## Commands / queries / events
Replay of issue and expiry sequences.

## States & transitions
Shared with PS-075-03.

## Validation & errors
Shared with PS-075-02.

## Authorization
Shared with PS-075-05.

## Failure, idempotency, concurrency, offline
Shared with PS-075-06.

## Privacy, retention, abuse
Shared with PS-075-07.

## Observability & budgets
Shared with PS-075-08.

## Tests
- TEST-PS-075-09-01 (golden): HALF_EVEN vectors through quote path.
- TEST-PS-075-09-02 (contract): replayed source responses produce expected quotes.
- TEST-PS-075-09-03 (e2e): proposal with cross-currency quote, consent, expiry after consent, settlement at pinned amount.
- TEST-PS-075-09-04 (a11y): quote display review.

## Acceptance criteria
1. CTR-COM-001 test 09 passes.
2. Replay suite green.
3. E2E pinned-amount test passes.

## Assumptions & open decisions
- D03 (PROVISIONAL, unapproved).
