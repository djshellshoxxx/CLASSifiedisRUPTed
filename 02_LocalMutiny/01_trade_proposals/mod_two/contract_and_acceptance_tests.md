# PS-015-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-09.R01 | Contract tests for every command and event in PS-015-04. | MVP |
| PS-015-09.R02 | Fixtures: direct two-party, matched sizes 3–6, offer supersede after accept, feasibility outage. ≥ 40 fixtures. | MVP |
| PS-015-09.R03 | Each acceptance criterion in PS-015-01..08 maps to a TEST ID. | MVP |
| PS-015-09.R04 | End-to-end: direct two-party barter from proposal to `locked`, with `mod_party` and `mod_offer` contracts. | MVP |

## Data / schema
Fixtures at `fixtures/cycle/` (paths PENDING implementation).

## Commands / queries / events
Harness drives proposal, acceptance, confirm and lock sequences.

## States & transitions
Model-based generation from PS-015-03.

## Validation & errors
One fixture and one message-key assertion per `TWO.*` code.

## Authorization
Matrix from PS-015-05.

## Failure, idempotency, concurrency, offline
Concurrency and crash-restart suites from PS-015-06.

## Privacy, retention, abuse
Forbidden-field assertions across all fixture outputs.

## Observability & budgets
Suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-015-09-01 (contract): schema snapshot diff.
- TEST-PS-015-09-02 (model-based): 10,000 sequences.
- TEST-PS-015-09-03 (e2e): two-party barter to lock.

## Acceptance criteria
1. 100% acceptance criteria mapped to passing TEST IDs.
2. Fixture thresholds met.

## Assumptions & open decisions
- ASSUMPTION: no implementation exists; fixtures are future-prompt work.
- PENDING F14 review of confirmation-window announcements.
