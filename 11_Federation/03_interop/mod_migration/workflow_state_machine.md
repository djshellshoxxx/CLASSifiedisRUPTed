# PS-090-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07), CTR-EVT-001 (R02), CTR-FED-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-03.R01 | Run lifecycle: planned → approved → running → completed; or running → failed; failed → running (resume) or → rolled_back. | MVP |
| PS-090-03.R02 | Completed runs roll back only within `rollback_deadline`. | MVP |
| PS-090-03.R03 | A run cannot start until two distinct approvals are recorded. | MVP |

## Data / schema
`status` and `approvals[]` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
`migration.plan` → `migration.planned`; `migration.approve` → `migration.approved`; `migration.execute` → `migration.completed` or `migration.failed`; `migration.rollback` → `migration.rolled_back`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | migration.plan | PS-090-02 passes; dry run digest stored | planned | notify approvers |
| planned | migration.approve | approver distinct; count < 2 | planned (1 approval) or approved (2) | none |
| approved | migration.execute | digest matches plan | running | checkpoints start |
| running | batch done | checkpoint written | running | none |
| running | all done | verification pass | completed | rollback clock starts |
| running | error | any | failed | quarantine affected records; original bytes kept |
| failed | migration.execute | checkpoint valid | running | resume |
| failed, completed | migration.rollback | within deadline | rolled_back | restore prior pointers |

## Validation & errors
`MIGRATE.INVALID_TRANSITION` (409); `MIGRATE.ROLLBACK_WINDOW_CLOSED` (409).

## Authorization
Plan and execute: `ope` with dual control. Approve: two distinct `ope` principals, neither the planner (CAP.SELF_APPROVAL_FORBIDDEN).

## Failure, idempotency, concurrency, offline
Transitions use `expected_revision`. Resume is idempotent per checkpoint.

## Privacy, retention, abuse
Transitions carry IDs and counts.

## Observability & budgets
Gauges per state; time in `running`.

## Tests
- TEST-PS-090-03-01 (state): table rows pass.
- TEST-PS-090-03-02 (approval): one approval cannot start a run.
- TEST-PS-090-03-03 (deadline): rollback after deadline rejected.
- TEST-PS-090-03-04 (resume): run killed mid-batch resumes from checkpoint without duplicate writes.

## Acceptance criteria
1. Table exhaustive.
2. Dual approval enforced.
3. Resume produces no duplicates.

## Assumptions & open decisions
- ASSUMPTION: 14-day rollback window.
