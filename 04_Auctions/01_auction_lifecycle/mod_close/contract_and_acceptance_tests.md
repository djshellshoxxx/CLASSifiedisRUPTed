# PS-034-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_close. **Parent:** [mod_close SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (transaction handoff; claim states), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-034-09.R01 | Contract tests validate all commands and events against CTR-SCH-001 and the `trx_` handoff against CTR-COM-001. | MVP |
| PS-034-09.R02 | End-to-end: bid → close (SOLD) → winner confirms → `trx_` created → winner's claim submitted by F09 (out of this module's scope, asserted as handoff only). | MVP |
| PS-034-09.R03 | End-to-end: no bids → UNSOLD; reserve not met → UNSOLD; seller cancel with no bids → CANCELLED. | MVP |
| PS-034-09.R04 | Accessibility: end state and winner status announced; reserve shown only as met or not met. | MVP |

## Data / schema
Fixtures: `fixtures/close/sold_confirmed.json`, `sold_unconfirmed.json`, `reserve_boundary.json`, `cancel_with_bids.json` (names proposed; created in implementation phase). Synthetic accounts only.

## Commands / queries / events
Replay of recorded bid events through the close job.

## States & transitions
Each state in PS-034-03 has positive and negative tests.

## Validation & errors
100% coverage of CLOSE codes.

## Authorization
Matrix tests from PS-034-05 included.

## Failure, idempotency, concurrency, offline
Chaos: F09 timeout at confirm, duplicate close job, crash at each checkpoint.

## Privacy, retention, abuse
Fixtures never include real winner or payment identifiers.

## Observability & budgets
Suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-034-09-01 (contract): all commands and events validate; `trx_` handoff matches CTR-COM-001.
- TEST-PS-034-09-02 (e2e): sold, confirmed, one `trx_`, zero `clm_` created by this module.
- TEST-PS-034-09-03 (e2e): unsold and cancelled paths.
- TEST-PS-034-09-04 (boundary): reserve equal → SOLD; one minor unit below → UNSOLD.
- TEST-PS-034-09-05 (a11y): end-state announcement passes screen-reader checks.

## Acceptance criteria
1. All e2e paths pass including failure paths.
2. Error-code coverage 100%.
3. No test asserts or displays a PAID or SETTLED label.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as CI accessibility mapping.
- OPEN: runner-up routing (Future scope). See [DECISIONS.md](../../../DECISIONS.md) D04.
