# PS-090-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R05–R07, R09), CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-05.R01 | Plan, approve, execute and rollback require `ope` principals with dual control on each run. | MVP |
| PS-090-05.R02 | Approvers must differ from the planner and from each other. | MVP |
| PS-090-05.R03 | Execution by `sys_` job only after approval; grant expiry ≤ 72 h (CTR-CAP-001 R06). | MVP |
| PS-090-05.R04 | No `mod` principal may plan or execute migrations. | MVP |
| PS-090-05.R05 | Default deny. | MVP |

## Data / schema
Capabilities: `migration.plan`, `migration.approve`, `migration.execute`, `migration.rollback`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.FORBIDDEN`, `CAP.DUAL_APPROVAL_REQUIRED`, `CAP.SELF_APPROVAL_FORBIDDEN`.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| ope A | migration.plan | run | ALLOW |
| ope A | migration.approve | own plan | DENY, CAP.SELF_APPROVAL_FORBIDDEN |
| ope B | migration.approve | plan by A | ALLOW (approval 1 of 2) |
| ope A | migration.execute | approved plan | DENY until second approval (CAP.DUAL_APPROVAL_REQUIRED) |
| mod | migration.plan | run | DENY, SYS.FORBIDDEN |
| sys_ job | migration.execute | approved run | ALLOW |

## Failure, idempotency, concurrency, offline
Decision fails closed. No offline path.

## Privacy, retention, abuse
Every privileged decision emits an `aud_` record (CTR-CAP-001 R08).

## Observability & budgets
`migrate_authz_denies_total{action}`.

## Tests
- TEST-PS-090-05-01 (matrix): table outcomes.
- TEST-PS-090-05-02 (dual control): execute blocked with one approval.
- TEST-PS-090-05-03 (mod): mod principal cannot plan.

## Acceptance criteria
1. Matrix passes.
2. Dual control holds.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 default, unapproved).
