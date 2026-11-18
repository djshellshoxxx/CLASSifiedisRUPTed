# PS-094-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-09.R01 | Every row in PS-094-02 to PS-094-08 maps to at least one test ID. | MVP |
| PS-094-09.R02 | Reporter-identity leak tests run on every endpoint, notice and event. | MVP |

## Test map
| Test ID | Level | Scope |
|---|---|---|
| TEST-PS-094-01-01 | lint | classes; no dedupe_hmac in events |
| TEST-PS-094-01-02 | visibility | reported party response shape |
| TEST-PS-094-02-01 | unit | error codes and conditions |
| TEST-PS-094-02-02 | boundary | 500 vs 501 characters after NFC |
| TEST-PS-094-02-03 | negative | self, unreadable, restricted |
| TEST-PS-094-03-01 | property | state sequences |
| TEST-PS-094-03-02 | integration | withdraw after triage |
| TEST-PS-094-03-03 | threshold | priority only |
| TEST-PS-094-04-01 | contract | schema 1.0.0 |
| TEST-PS-094-04-02 | idempotency | single report |
| TEST-PS-094-04-03 | lint | event payload fields |
| TEST-PS-094-05-01 | matrix | action matrix |
| TEST-PS-094-05-02 | negative | identical 404 for owner |
| TEST-PS-094-05-03 | scope | triage queue fields |
| TEST-PS-094-06-01 | retry | duplicate submits |
| TEST-PS-094-06-02 | offline | queue survives restart |
| TEST-PS-094-06-03 | fault | crash after insert |
| TEST-PS-094-07-01 | privacy | reporter identity absence |
| TEST-PS-094-07-02 | abuse | brigading cap |
| TEST-PS-094-07-03 | redaction | doxxing text redaction |
| TEST-PS-094-08-01 | logs | no content in logs |
| TEST-PS-094-08-02 | alert | brigading alert |
| TEST-PS-094-08-03 | load | submit budget |
| TEST-PS-094-10-01 | export | own status export only |
| TEST-PS-094-10-02 | rollback | intake off, reads on |

Accessibility: report form and status screens pass WCAG 2.1 AA (F14), TEST-PS-094-09-01.

## Acceptance criteria
1. All test IDs pass in CI before implementation sign-off (future phase).
2. Zero reporter-identity leaks in negative and privacy suites.

## Assumptions & open decisions
- ASSUMPTION: synthetic fixtures only.
- OPEN: F14 accessibility scope.
