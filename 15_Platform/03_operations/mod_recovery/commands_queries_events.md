# PS-122-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-04.R01 | All commands are internal, require `expected_revision` on the run aggregate and an `idempotency_key`. | MVP |
| PS-122-04.R02 | `restore_run.step` accepts only the next step name; any other returns `RECOVERY.STEP_ORDER_VIOLATION`. | MVP |
| PS-122-04.R03 | Events carry run ID, status and counts only. | MVP |

## Data / schema
| Command | Signature | Idempotency scope | Emits | Errors |
|---|---|---|---|---|
| `restore_run.create` | (bkp_id, target, change_ref) | (actor, key) | `restore.planned` (local record) | RECOVERY.ISOLATION_NOT_PROVEN, RECOVERY.SOURCE_NOT_RESTORABLE, RECOVERY.TARGET_NOT_APPROVED |
| `restore_run.approve` | (rst_id, expected_revision) | (approver, rst_id) | `restore.started` on run start | CAP.SELF_APPROVAL_FORBIDDEN, CAP.DUAL_APPROVAL_REQUIRED |
| `restore_run.step` | (rst_id, step_name, expected_revision) | (rst_id, step_name) | step events | RECOVERY.STEP_ORDER_VIOLATION, RECOVERY.HASH_CHAIN_BROKEN |
| `restore_run.promote` | (rst_id, second_approver) | (rst_id) | `restore.promoted` | RECOVERY.NOT_READ_ONLY |
| `restore_run.abort` | (rst_id, reason_code) | (rst_id) | `restore.aborted` | SYS.GONE on repeat |
| `drill_record.create` | (rst_id, measured values, checks) | (rst_id) | `drill.recorded` | RECOVERY.DRILL_INCOMPLETE |

## States & transitions
Effects follow PS-122-03.

## Validation & errors
Per PS-122-02 and PS-122-06.

## Authorization
See PS-122-05.

## Failure, idempotency, concurrency, offline
Revision conflicts return `EVT.REVISION_CONFLICT`. Commands are safe to repeat.

## Privacy, retention, abuse
No object content in any payload.

## Observability & budgets
Step durations recorded per step name.

## Tests
- TEST-PS-122-04-01 (contract): each command signature and error list.
- TEST-PS-122-04-02 (concurrency): two approvals race; one approval recorded.
- TEST-PS-122-04-03 (negative): wrong step name refused.
- TEST-PS-122-04-04 (privacy): event payload scan finds no record content.

## Acceptance criteria
1. Command table matches internal API.
2. TEST-PS-122-04-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 72 h run retention before automatic destruction of isolated data.
