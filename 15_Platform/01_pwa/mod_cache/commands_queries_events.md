# PS-114-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-04.R01 | No server command. The module exposes local operations only: `cache.purge_data`, `cache.activate_build`. | MVP |
| PS-114-04.R02 | Consumes `session.revoked` and `session.ended` from F07 sessions to trigger purge. | MVP |
| PS-114-04.R03 | Purge completes within 1 s when app is open; otherwise on next app start before any render of account data. | MVP |
| PS-114-04.R04 | No event is emitted to the server by this module. | MVP |

## Data / schema
**Local operations**

| Operation | Trigger | Idempotent | Errors |
|---|---|---|---|
| `cache.purge_data` | logout, account switch, session revoked, clear data | yes | CACHE.PURGE_PARTIAL (retry) |
| `cache.activate_build` | install completes | yes | CACHE.MANIFEST_MISMATCH |

**Consumed events**: `session.revoked` (F07), `session.ended` (F07). Max data class per producer.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Local only; the page cannot call purge for another account.

## Failure, idempotency, concurrency, offline
Purge retried on failure; offline works because purge is local.

## Privacy, retention, abuse
No data leaves device.

## Observability & budgets
Local timing only.

## Tests
- TEST-PS-114-04-01 (contract): no outbound request is made by purge.
- TEST-PS-114-04-02 (integration): `session.revoked` triggers purge once.
- TEST-PS-114-04-03 (integration): purge partial failure retried and completes.
- TEST-PS-114-04-04 (unit): activate is idempotent for the same build_id.

## Acceptance criteria
1. Zero server calls from cache module (network trace).
2. Purge timing met in test.
3. Idempotent activation verified.

## Assumptions & open decisions
- ASSUMPTION: F07 session events reach the client on open connection, else on next start.
- No Dxx applies.
