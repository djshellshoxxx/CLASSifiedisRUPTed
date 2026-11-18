# PS-039-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_availability. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-039-09.R01 | Contract tests validate `availability.*` and `rental.availability.*` against CTR-EVT-001 and CTR-ERR-001. | MVP |
| PS-039-09.R02 | Fixtures cover adjacency (end = start), 365-day span, 730-day horizon, DST-change week in item timezone. | MVP |
| PS-039-09.R03 | Lifecycle integration with mod_handoff and mod_return stubs for BOOKED to IN_USE to RELEASED. | MVP |
| PS-039-09.R04 | Zero renter identifiers in public responses across the corpus. | MVP |

## Data / schema
Synthetic items with `lst_` fixture IDs; no real addresses.

## Commands / queries / events
Consumer-driven tests for owner calendar UI and renter calendar UI.

## States & transitions
Scenario walks for each PS-039-03 row.

## Validation & errors
Negative fixtures per AVAIL.* code.

## Authorization
Negative tests per PS-039-05 row.

## Failure, idempotency, concurrency, offline
Concurrency (50 parallel holds), timer, offline owner block replay (PS-039-06).

## Privacy, retention, abuse
Lint and abuse tests (PS-039-07).

## Observability & budgets
Assert counters per fixture.

## Tests
- TEST-PS-039-09-01 (contract): events validate.
- TEST-PS-039-09-02 (boundary): DST-week fixture produces correct local dates.
- TEST-PS-039-09-03 (e2e): hold, confirm, handoff, return, release; calendar shows BUSY then FREE.
- TEST-PS-039-09-04 (a11y): calendar grid keyboard navigable with announced FREE/BUSY state (F14).

## Acceptance criteria
1. Contract suite green.
2. Adjacency and DST fixtures pass.
3. Zero identifier leaks in corpus.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures for planning.
- PROVISIONAL (D08 default, unapproved): offline fixtures reflect pending-queue model.
