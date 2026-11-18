# PS-047-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-PRV-001 (R04); PENDING CTR-DSC-001.

**Decision labels:** Dual approval for registry changes PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-04.R01 | All state-changing commands require `idempotency_key`; same key and digest return original result. | MVP |
| PS-047-04.R02 | `cell.approve` and `cell.retire` require `registry_version` precondition (optimistic concurrency). | MVP |
| PS-047-04.R03 | `geo.cell.published_state_changed` payload contains `cell_code`, `state`, `registry_version`, no count. | MVP |
| PS-047-04.R04 | Query `geo.cells.list(version?)` returns active and retired codes with publication flag only. | MVP |

## Data / schema
| Name | Kind | Signature | Idempotency | Version | Errors |
|---|---|---|---|---|---|
| `cell.propose` | command | `(cell_code, parent_code, label_key, justification ≤ 500)` | key | 1.0.0 | COARSE.REGISTRY_INVALID, COARSE.LABEL_MISSING |
| `cell.approve` | command | `(proposal_id, registry_version)` | key | 1.0.0 | COARSE.CONFLICT, COARSE.INVALID_TRANSITION |
| `cell.retire` | command | `(cell_code, registry_version)` | key | 1.0.0 | COARSE.CELL_IN_USE |
| `publication.recompute` | command (sys) | `(window_id)` | `window_id` | 1.0.0 | COARSE.RECOMPUTE_FAILED (retryable true) |
| `geo.cells.list` | query | `(version?)` | n/a | 1.0.0 | SYS.NOT_FOUND |
| `geo.cell.published_state_changed` | event | see R03 | n/a | 1.0.0 | n/a |

## States & transitions
See PS-047-03.

## Validation & errors
See PS-047-02.

## Authorization
See PS-047-05.

## Failure, idempotency, concurrency, offline
Retries of recompute keyed by `window_id`. Offline clients receive a cached registry version and must refresh before search.

## Privacy, retention, abuse
Justification text is PRIVATE to ope_ and F10; not in events.

## Observability & budgets
Trace `correlation_id` for approvals; recompute budget in PS-047-08.

## Tests
- TEST-PS-047-04-01 (contract): command schemas match registry.
- TEST-PS-047-04-02 (unit): duplicate `cell.approve` with same key returns original.
- TEST-PS-047-04-03 (contract): event payload has no count field.

## Acceptance criteria
1. Every command has version and idempotency rule.
2. Stale `registry_version` returns COARSE.CONFLICT.
3. Event schema has no numeric count.

## Assumptions & open decisions
- ASSUMPTION: justification field capped at 500 chars.
