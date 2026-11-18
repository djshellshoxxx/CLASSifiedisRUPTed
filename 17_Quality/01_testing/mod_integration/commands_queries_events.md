# PS-135-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-04.R01 | `integration.run_scenario` is idempotent by (`commit_sha`, `scenario_id`, `attempt`). | MVP |
| PS-135-04.R02 | `integration.clear_quarantine` requires a written reason of 20–500 characters. | MVP |
| PS-135-04.R03 | Result query p95 ≤ 200 ms (ASSUMPTION). | MVP |
| PS-135-04.R04 | Events are emitted for every transition in PS-135-03. | MVP |

## Data / schema
Command bodies: `scenario_id`, `commit_sha`, `environment_id`, `attempt`.

## Commands / queries / events
| Name | Kind | Errors |
|---|---|---|
| integration.run_scenario | command | INTEGR.CONTRACT_UNKNOWN, INTEGR.FIXTURE_DIGEST_MISMATCH |
| integration.clear_quarantine | command | CAP.SELF_APPROVAL_FORBIDDEN (where runner = clearer), SYS.FORBIDDEN |
| integration.get_run / integration.list_runs | query | SYS.NOT_FOUND |
| integration_run.queued / started / passed / failed / skipped / flaky_quarantined / cleared | event | n/a |

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Per [validation_rules.md](validation_rules.md).

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Repeat trigger with same key returns the existing run.

## Privacy, retention, abuse
Events carry `runner` as a CI principal or `ope_`.

## Observability & budgets
Latency and error counters by code.

## Tests
- TEST-PS-135-04-01: contract, event schemas.
- TEST-PS-135-04-02: integration, duplicate trigger returns one run.

## Acceptance criteria
1. Duplicate triggers never create duplicate runs.
2. Clearance without reason is rejected.

## Assumptions & open decisions
- ASSUMPTION: CI principal is `sys_`.
- D01 (federation relay scenarios): PROVISIONAL (D01 default, unapproved).
