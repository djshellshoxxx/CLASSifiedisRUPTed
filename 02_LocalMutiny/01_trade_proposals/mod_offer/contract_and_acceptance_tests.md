# PS-013-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-09.R01 | Contract tests run in CI against CTR-SCH-001 schema snapshots for every command and event in PS-013-04. | MVP |
| PS-013-09.R02 | Fixture set: ≥ 40 valid and ≥ 60 invalid offer fixtures covering every code in PS-013-02. | MVP |
| PS-013-09.R03 | Each acceptance criterion in PS-013-01..08 maps to at least one TEST ID. | MVP |
| PS-013-09.R04 | Offline and reconnect scenarios run on a device emulator with network toggled (PS-013-06). | MVP |

## Data / schema
Fixture files: `fixtures/offer/valid/*.json`, `fixtures/offer/invalid/*.json` (paths PENDING implementation; no code exists yet). Each fixture names its expected code.

## Commands / queries / events
Contract test harness replays command sequences and asserts events and errors.

## States & transitions
Model-based test generates sequences from PS-013-03 table; asserts end state and event order.

## Validation & errors
Every `OFFER.*` code has one fixture and one assertion of `message_key`.

## Authorization
Matrix tests from PS-013-05 run as part of this suite.

## Failure, idempotency, concurrency, offline
Concurrency suite (PS-013-06) runs at 20 and 200 parallel clients. Offline suite runs on airplane-mode toggles.

## Privacy, retention, abuse
Privacy assertion: no fixture output contains note text in forbidden surfaces (PS-013-07).

## Observability & budgets
Suite runtime ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-013-09-01 (contract): schema snapshot diff fails build on breaking change.
- TEST-PS-013-09-02 (model-based): 10,000 transition sequences.
- TEST-PS-013-09-03 (a11y): submit and error screens meet WCAG 2.1 AA for error announcements (F14 review pending).

## Acceptance criteria
1. 100% of acceptance criteria in this module map to a passing TEST ID.
2. Fixture count and code coverage thresholds met (R02).

## Assumptions & open decisions
- ASSUMPTION: no implementation exists; fixtures and harness are future-prompt work.
- PENDING F14 accessibility review of error announcement patterns.
