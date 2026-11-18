# PS-086-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03 idempotency, R10 event_type shape, R11 max_data_class), CTR-FED-001 (`peer.*` events), CTR-ERR-001, CTR-SCH-001 (R01 registry), CTR-CAP-001 (R08 audit).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-04.R01 | `conflict.open` is internal (`sys_`). `conflict.review` and `conflict.close` are `ope_` commands. `conflict.list` and `conflict.get` are queries. | MVP |
| PS-086-04.R02 | State-changing commands carry `idempotency_key` and `expected_revision` (CTR-EVT-001 R02, R03). | MVP |
| PS-086-04.R03 | Event types: `conflict.opened`, `conflict.reviewed`, `conflict.closed` (past-tense verb, CTR-EVT-001 R10). `max_data_class` is `PUBLIC` or `PSEUDONYMOUS`. | MVP |
| PS-086-04.R04 | Queries return IDs, digests, status and timestamps. Raw evidence bytes are never returned by a query (see PS-086-05 R04). | MVP |

## Commands / queries / events
| Operation | Input (logical) | Idempotency key | Version | Output / errors |
|---|---|---|---|---|
| `conflict.open` | `kind`, origin, aggregate, revisions, event IDs, digests | (`sys_`, command, `event_id` pair) | 1.0.0 | `cfl_id`; `FED.EQUIVOCATION`; `CONFLICTS.REVISION_GAP` |
| `conflict.review` | `cfl_id`, `decision` (`keep_quarantine`, `restore_restricted`, `restore_trusted`, `revoke_peer`), `review_note_ref` | `(ope_, command, key)` | 1.0.0 | `reviewed`; `CONFLICTS.REVIEW_REQUIRED` |
| `conflict.close` | `cfl_id` | same | 1.0.0 | `closed`; `EVT.REVISION_CONFLICT` |
| `conflict.list` | filter by `origin_node`, `status`, `kind`; page | none | 1.0.0 | page of records (no bytes) |
| `conflict.get` | `cfl_id` | none | 1.0.0 | record without bytes; `SYS.NOT_FOUND` if not permitted |

Events: `conflict.opened`, `conflict.reviewed`, `conflict.closed`. Payloads hold `cfl_id`, `kind`, `origin_node`, `status` and codes only.

## Example (shape)
`conflict.review` request: `{"cfl_id":"cfl_<26>","decision":"keep_quarantine","expected_revision":1,"idempotency_key":"<uuid>"}`. Response: `{"cfl_id":"cfl_<26>","status":"reviewed","revision":2}`.

## States & transitions
Not applicable to operations. See PS-086-03.

## Validation & errors
Inputs validated per PS-086-02 and the enum above. Unknown `decision` → `CONFLICTS.REVIEW_REQUIRED`? No: unknown decision is a validation failure `SYS.VALIDATION_FAILED` (PENDING CTR-ERR-001 registry check).

## Authorization
Capabilities per PS-086-05.

## Failure, idempotency, concurrency, offline
A repeat command with the same key and same request digest returns the original result (CTR-EVT-001 R03). A different digest under the same key returns `EVT.IDEMPOTENCY_KEY_REUSED`. See PS-086-06.

## Privacy, retention, abuse
Operation logs carry operation, IDs and codes only.

## Observability & budgets
Latency and counts in PS-086-08.

## Tests
- TEST-PS-086-04-01 (contract): each operation round-trips against its schema.
- TEST-PS-086-04-02 (contract): repeat `conflict.review` with same key returns the original result with no second event.
- TEST-PS-086-04-03 (integration): `conflict.list` and `conflict.get` never include evidence bytes.
- TEST-PS-086-04-04 (contract): every emitted event's `max_data_class` ≤ PSEUDONYMOUS.

## Acceptance criteria
1. Schemas published at 1.0.0; TEST-PS-086-04-01 passes.
2. Idempotent replay produces no new event; TEST-PS-086-04-02 passes.
3. No bytes in query responses; TEST-PS-086-04-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- PENDING CTR-SCH-001: operation and event schema IDs.
- PENDING CTR-ERR-001: `SYS.VALIDATION_FAILED` mapping for unknown enum values (confirm code name with F15).
- OPEN: whether `event_type` is a registry entry (CTR-EVT-001 open item).
