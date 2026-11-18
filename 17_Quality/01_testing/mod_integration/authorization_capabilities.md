# PS-135-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-05.R01 | CI principal `sys_` may run scenarios; it may not clear quarantine. | MVP |
| PS-135-05.R02 | Clearing a quarantine requires an `ope` with QA Lead role, distinct from the engineer who last changed the scenario. | MVP |
| PS-135-05.R03 | Fixture writes require `administer` on `integration_fixture` at `global` scope. | MVP |
| PS-135-05.R04 | Staging seeded environment is reachable only by CI and QA Lead principals. | MVP |

## Data / schema
Capability IDs: `integration_run.execute`, `integration_run.clear`, `integration_fixture.administer`.

## Commands / queries / events
Decision records for each denial.

## States & transitions
N/A.

## Validation & errors
| Actor | Action | Result |
|---|---|---|
| sys (CI) | run_scenario | allow |
| sys (CI) | clear_quarantine | DENY, SYS.FORBIDDEN |
| ope (QA Lead, not last editor) | clear_quarantine | allow |
| ope (last editor) | clear_quarantine | DENY, CAP.SELF_APPROVAL_FORBIDDEN |

## Authorization
Grants for CI principals are scoped to repository and branch.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
Denials carry no test content.

## Observability & budgets
Counter `integration_authz_denied_total{rule}`.

## Tests
- TEST-PS-135-05-01: unit, decision table.
- TEST-PS-135-05-02: negative, CI attempts to clear quarantine.

## Acceptance criteria
1. CI cannot clear quarantine in any fixture.
2. Editor cannot clear own scenario.

## Assumptions & open decisions
- ASSUMPTION: QA Lead role holder list maintained by F17.
- D10 (no change): PROVISIONAL (D10 default, unapproved) for any credential used by staging seeds.
