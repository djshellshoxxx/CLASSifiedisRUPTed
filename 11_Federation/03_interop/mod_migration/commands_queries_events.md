# PS-090-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-04.R01 | Every command takes `idempotency_key` and `expected_revision`. | MVP |
| PS-090-04.R02 | Events `migration.planned`, `migration.approved`, `migration.completed`, `migration.failed`, `migration.rolled_back`. | MVP |
| PS-090-04.R03 | `migration.query_run` returns status, counts and digests; no record content. | MVP |

## Data / schema
Schemas `migration.*@1.0.0` per CTR-SCH-001. Fields in [domain_schema.md](domain_schema.md).

| Command | Actor | Event | Errors |
|---|---|---|---|
| migration.plan | ope | migration.planned | HOOK_MISSING, LOSSY_FORBIDDEN, SCOPE_INVALID |
| migration.approve | ope (distinct) | migration.approved | CAP.SELF_APPROVAL_FORBIDDEN, INVALID_TRANSITION |
| migration.execute | ope | completed / failed | PLAN_STALE, DATA_CLASS_CHANGE_REQUIRES_REVIEW |
| migration.rollback | ope | migration.rolled_back | ROLLBACK_WINDOW_CLOSED, ROLLBACK_TARGET_INVALID |

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md); CTR-ERR-001 envelope.

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Same key and digest return original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`.

## Privacy, retention, abuse
Events carry IDs, versions and counts.

## Observability & budgets
Event counts; migration event lag ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-090-04-01 (contract): event schemas validate.
- TEST-PS-090-04-02 (idempotency): duplicate execute does not start second run.
- TEST-PS-090-04-03 (query): query omits record content.

## Acceptance criteria
1. Command table complete.
2. Duplicate execute safe.

## Assumptions & open decisions
- PENDING: consumer list in DEPENDENCY_MATRIX.md.
