# PS-014-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-09.R01 | Contract tests cover every command and event in PS-014-04 against CTR-SCH-001 snapshots. | MVP |
| PS-014-09.R02 | Fixtures: ≥ 30 valid and ≥ 50 invalid party fixtures covering every `PARTY.*` code. | MVP |
| PS-014-09.R03 | Each acceptance criterion in PS-014-01..08 maps to a TEST ID. | MVP |
| PS-014-09.R04 | Two-party and six-party cycle fixtures run end to end with `mod_offer` and `mod_two` contracts. | MVP |

## Data / schema
Fixtures at `fixtures/party/valid|invalid/` (paths PENDING implementation).

## Commands / queries / events
Harness replays invite/accept/decline sequences and asserts events.

## States & transitions
Model-based generation from PS-014-03.

## Validation & errors
One fixture and one `message_key` assertion per code.

## Authorization
Matrix from PS-014-05 runs in this suite.

## Failure, idempotency, concurrency, offline
Concurrency at 20 and 200 clients; offline suite for decline and withdraw.

## Privacy, retention, abuse
Assertion: no `acc_id` in any fixture output outside system scope.

## Observability & budgets
Suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-014-09-01 (contract): schema snapshot diff fails build on breaking change.
- TEST-PS-014-09-02 (model-based): 10,000 sequences.
- TEST-PS-014-09-03 (e2e): six-party cycle invites, accepts and locks.

## Acceptance criteria
1. 100% acceptance criteria mapped to passing TEST IDs.
2. Fixture thresholds met (R02).

## Assumptions & open decisions
- ASSUMPTION: no implementation exists; fixtures are future-prompt work.
- PENDING F14 review of invitation and error announcement patterns.
