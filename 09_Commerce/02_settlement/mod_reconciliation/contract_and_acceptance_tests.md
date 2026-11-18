# PS-072-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Tests 03, 07, 08, 13), CTR-EVT-001, CTR-ERR-001, CTR-SCH-001. **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-09.R01 | Synthetic drift fixture suite: one fixture per finding type plus a clean fixture. | MVP |
| PS-072-09.R02 | Contract tests for `recon_run` and `recon_finding` schemas. | MVP |
| PS-072-09.R03 | Partial-coverage contract: a partial run never reports `complete`. | MVP |
| PS-072-09.R04 | Accessibility: finding list screens pass WCAG 2.1 AA. | MVP |

## Data / schema
Fixtures: claim sets with known drift; adapter results with gaps; duplicate tx pairs.

## Commands / queries / events
Replay of run and resolve sequences.

## States & transitions
Shared with PS-072-03.

## Validation & errors
Shared with PS-072-02.

## Authorization
Shared with PS-072-05.

## Failure, idempotency, concurrency, offline
Shared with PS-072-06.

## Privacy, retention, abuse
Shared with PS-072-07.

## Observability & budgets
Shared with PS-072-08.

## Tests
- TEST-PS-072-09-01 (contract): schemas validate.
- TEST-PS-072-09-02 (golden): drift fixtures produce expected findings exactly.
- TEST-PS-072-09-03 (e2e): scheduled run, finding opened, case created, finding resolved.
- TEST-PS-072-09-04 (a11y): finding list audit.

## Acceptance criteria
1. Each finding type detected only in its fixture.
2. Clean fixture yields zero findings.
3. Partial coverage never shown as clean.

## Assumptions & open decisions
- ASSUMPTION: fixture suite maintained with mod_crypto replay data.
- D04 (PROVISIONAL, unapproved).
