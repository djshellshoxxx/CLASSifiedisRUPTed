# PS-122-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-05.R01 | Default deny. Restore is never available to `acc_`, `mod_` or `fpr_` principals. | MVP |
| PS-122-05.R02 | `restore_run.execute` is granted to `ope` in the platform recovery role, scoped to one run, with 72 h maximum (CTR-CAP-001 R06). | MVP |
| PS-122-05.R03 | Initiator and approvers are distinct `ope` principals; self-approval is refused (CTR-CAP-001 R07). | MVP |
| PS-122-05.R04 | Restored data is governed by the same classes as source; access to restored content requires the matching PRIVATE, FINANCIAL or LOCATION_PRECISE dual control. | MVP |
| PS-122-05.R05 | Support staff cannot restore user credentials or bypass recovery proofs (CTR-CAP-001 R12). | MVP |
| PS-122-05.R06 | Every run step and approval emits a CTR-EVT-001 event and an `aud_` record (CTR-CAP-001 R08). | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `restore_run.execute` | ope (recovery role) | restore_run, scope case | execute |
| `restore_run.approve` | ope (distinct) | restore_run, scope case | accept |
| `drill_record.create` | ope or sys (drill runner) | drill_record, scope global | create |
| `drill_record.read` | ope | drill_record, scope global | read |

## Commands / queries / events
Each command in PS-122-04 checks the capability before execution.

## States & transitions
Approval state is part of the run; no grant exists before approvals are complete (CTR-CAP-001 states).

## Validation & errors
`SYS.FORBIDDEN` for visible but denied; `SYS.NOT_FOUND` otherwise.

## Authorization
Decision cache zero for all restore capabilities (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Revocation of recovery role during a run halts the run at the next step.

## Privacy, retention, abuse
Break-glass restore is not provided in MVP (Future decision, OPEN).

## Observability & budgets
Metric: `recovery_denied_total{capability}`; alert on any denied attempt outside a drill window.

## Tests
- TEST-PS-122-05-01 (matrix): each principal kind per capability.
- TEST-PS-122-05-02 (privileged): single-approver promote refused with `CAP.DUAL_APPROVAL_REQUIRED`.
- TEST-PS-122-05-03 (negative): support role attempt to restore a credential table refused.
- TEST-PS-122-05-04 (audit): each step emits `aud_` record.

## Acceptance criteria
1. No user or federated principal can start a restore (TEST-01).
2. TEST-PS-122-05-01 through -04 pass.

## Assumptions & open decisions
- OPEN: break-glass procedure (Future).
