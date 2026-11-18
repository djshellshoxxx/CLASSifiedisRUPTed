# PS-022-04 — Commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-04.R01 | Every command carries `expected_revision`, `idempotency_key` (UUIDv7) and declared `event_type`. | MVP |
| PS-022-04.R02 | `cyc.withdraw` server p95 ≤ 300 ms. | MVP |
| PS-022-04.R03 | Queries return the case to the cycle's participants only, with resolution and per-party booleans. | MVP |
| PS-022-04.R04 | Schemas version 1.0.0 (CTR-SCH-001). | MVP |

## Data / schema
Command example: `{"cycle_id":"cyc_...","proposal_version":2,"reason_code":"WITHDREW","idempotency_key":"...","expected_revision":null}`.

## Commands / queries / events
| Name | Signature | Idempotency | Errors | Emits |
|---|---|---|---|---|
| `cyc.withdraw` | `withdraw(cycle_id, proposal_version, reason_code, idempotency_key)` | per party and version | CYC_DROPOUT.NOT_ELIGIBLE | `cycle.dropout_detected` |
| `cyc.dropout.report` | `report(cycle_id, proposal_version, party_id, reason_code, idempotency_key)` | merged per key | CYC_DROPOUT.WINDOW_OPEN | `cycle.dropout_detected` |
| `cyc.dropout.resolve` | `resolve(dropout_id, path, successor_version?, expected_revision)` | per dropout_id and path | SUCCESSOR_MISSING, LOCKS_ACTIVE | `cycle.resolved_again`, `cycle.cancelled`, `cycle.partially_resolved` |
| `cyc.dropout.get` | `get(dropout_id)` | n/a | SYS.NOT_FOUND | none |
| system timer | `escalate(dropout_id)` | per dropout_id | n/a | `cycle.escalated` |

Consumers: mod_lock (`cycle.dropout_detected`), F02.S02 (`cycle.resolved_again`), mod_recovery (`cycle.escalated`).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate keys replay the original response. Stale `expected_revision` → `SYS.CONFLICT`. Commands are not queued offline in MVP; the UI shows "withdrawal not sent" until acknowledged (D08).

## Privacy, retention, abuse
Events use `max_data_class` PSEUDONYMOUS; no reason text in payloads.

## Observability & budgets
Command counts per code; event lag p95 ≤ 5 s.

## Tests
- TEST-PS-022-04-01 (contract): examples validate against 1.0.0 schemas.
- TEST-PS-022-04-02 (integration): duplicate withdraw returns original response.
- TEST-PS-022-04-03 (contract): consumers ignore unknown `event_type` values.

## Acceptance criteria
1. Every command in the table is implemented with the declared signature.
2. Replays return identical bodies.
3. Consumer contract tests pass for mod_lock and mod_recovery.

## Assumptions & open decisions
- ASSUMPTION: `cyc.dropout.*` sub-verbs of `cyc.withdraw` family; CTR-CAP-001 vocabulary change is MINOR.
- [DECISIONS.md](../../../DECISIONS.md) D08 — PROVISIONAL (D08 default, unapproved): no offline queue for withdrawals in MVP.
