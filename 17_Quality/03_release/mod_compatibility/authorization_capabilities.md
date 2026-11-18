# PS-142-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-142-05.R02 | Publishing a matrix requires capability `compat.matrix.publish` and a second approver (not the author). | MVP |
| PS-142-05.R03 | Runners hold `compat.result.record` only; they cannot publish or change rows. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| QA release manager `acc_` with `compat.matrix.publish` | compat_matrix.create, publish | global | ALLOW with second approval |
| Runner `sys_` | compat_result.create | global | ALLOW |
| Runner `sys_` | compat_matrix.update | global | DENY |
| Any `acc_` with `compat.result.read` | compat_result.read | global | ALLOW |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden matrix: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Grant revocation is checked at each publish. No offline authorization path exists in this module.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-142-05-01 (negative): a runner principal publishing a matrix receives SYS.FORBIDDEN.
- TEST-PS-142-05-02 (negative): an author approving their own matrix is rejected.

## Acceptance criteria
1. TEST-PS-142-05-01, TEST-PS-142-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: capability names are provisional until F16 Security Lead review.
- D10 (auth and portability) does not change this module: PROVISIONAL (D10 default, unapproved).
