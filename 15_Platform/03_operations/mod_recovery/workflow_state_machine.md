# PS-122-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-03.R01 | Steps run in the fixed order restore, verify chain, replay tombstones and holds, rebuild indexes, verify read-only. Skipping a step is impossible by state. | MVP |
| PS-122-03.R02 | Writes are disabled until `read_only` checks pass; `promoted` enables writes. | MVP |
| PS-122-03.R03 | `aborted` and `failed` are terminal; partial restored data in an isolated target is destroyed after 72 h. | MVP |
| PS-122-03.R04 | Replay of deletions and holds must complete before any read path opens (CTR-PRV-001 R06, BT-04). | MVP |

## Data / schema
`status` field of PS-122-01. Events: `restore.started`, `restore.completed`, `restore.failed`, `restore.promoted`, `restore.aborted` (CTR-EVT-001, aggregate `restore_run`).

## Commands / queries / events
`restore_run.create`, `restore_run.approve`, `restore_run.step`, `restore_run.promote`, `restore_run.abort` (PS-122-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | create | PS-122-02 passes | planned | none |
| planned | approve (2nd approver) | approver distinct from initiator | approved | emit `restore.started` on run start |
| approved | step_restore | target isolated | restoring | copy objects |
| restoring | restore_done | counts match manifest | verifying | none |
| verifying | chain_ok | hash chain verified (CTR-EVT-001 R08) | replaying_holds | none |
| replaying_holds | tombstones_and_holds_applied | counts match | indexing | none |
| indexing | indexes_rebuilt | K_MIN and cell checks pass (CTR-PRV-001 R04) | read_only | open read-only |
| read_only | promote | target production; second approval | promoted | enable writes; emit `restore.promoted` |
| any active | fail or abort | — | failed or aborted | halt; retain logs |

## Validation & errors
Out-of-order step request: `RECOVERY.STEP_ORDER_VIOLATION` (precondition_failed, 412).

## Authorization
Approvals per PS-122-05. Promote requires a second, separate approval.

## Failure, idempotency, concurrency, offline
Each step is idempotent on (`rst_id`, step). One active run per target.

## Privacy, retention, abuse
Isolated targets have no outbound network to user devices or federation peers during restore.

## Observability & budgets
Timers per step; RTO target 4 h end to end (ASSUMPTION, measured in drills).

## Tests
- TEST-PS-122-03-01 (unit): transition table; out-of-order step refused.
- TEST-PS-122-03-02 (integration): writes refused until `read_only`.
- TEST-PS-122-03-03 (integration): deleted record absent after restore (tombstone replay before read).
- TEST-PS-122-03-04 (e2e): full restore in isolated environment within RTO budget.

## Acceptance criteria
1. Step order enforced (TEST-01).
2. TEST-PS-122-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 4-hour RTO and 15-minute RPO target.
