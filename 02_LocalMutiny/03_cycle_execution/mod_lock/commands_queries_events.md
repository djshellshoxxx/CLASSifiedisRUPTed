# PS-023-04 — Commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-04.R01 | Acquisition request carries `idempotency_key` (UUIDv7) and the cycle version; replay returns the original lock set. | MVP |
| PS-023-04.R02 | Acquisition p95 ≤ 200 ms for sets of ≤ 8 items (ASSUMPTION). | MVP |
| PS-023-04.R03 | Release and extension require `expected_fence`. | MVP |
| PS-023-04.R04 | Schemas 1.0.0; additive change MINOR (CTR-SCH-001). | MVP |

## Data / schema
Acquire request: `{"cycle_id":"cyc_...","proposal_version":2,"items":[{"item_id":"itm_...","owner_party_id":"acc_...","expected_availability":1}],"idempotency_key":"..."}`.
Response: `{"cycle_id":"cyc_...","locks":[{"lock_id":"lck_...","item_id":"itm_...","fence":7,"expires_at":"..."}],"state":"HELD_ALL"}`.

## Commands / queries / events
| Name | Signature | Idempotency | Errors | Emits |
|---|---|---|---|---|
| `cyc.execute.lock` | `acquire(cycle_id, proposal_version, items[], idempotency_key)` | per cycle version | PS-023-02 codes | `item.locked` ×N or `item.lock_failed` |
| `cyc.execute.release` | `release(lock_id, expected_fence, reason, idempotency_key)` | per lock_id and fence | STALE_FENCE | `item.lock_released` |
| `cyc.execute.extend` | `extend(lock_id, expected_fence, idempotency_key)` | per lock_id | EXTENSION_LIMIT | `item.lock_extended` |
| `cyc.lock.get` (query) | `get(cycle_id, proposal_version)` | n/a | SYS.NOT_FOUND | none |
| timer | `expire(lock_id, fence)` | per lock_id and fence | n/a | `item.lock_expired` |
| completion handler | `consume(cycle_id)` | per cycle version | n/a | `item.lock_consumed` |

Consumers: F01.S03.M01 (`item.locked`, `item.lock_released`, `item.lock_consumed` for availability), mod_dropouts (`item.lock_released`).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Replays return identical body. Acquisition is never queued offline; clients show "not reserved" until the server responds.

## Privacy, retention, abuse
Payloads contain item IDs and fences only; no descriptions or addresses.

## Observability & budgets
Latency histogram per command; contention counter per item class.

## Tests
- TEST-PS-023-04-01 (contract): examples validate.
- TEST-PS-023-04-02 (integration): duplicate acquire returns identical lock set.
- TEST-PS-023-04-03 (contract): F01 consumer ignores unknown lock fields.

## Acceptance criteria
1. Every command matches the declared signature.
2. Replays byte-identical.
3. Consumer contract tests pass for F01 and mod_dropouts.

## Assumptions & open decisions
- ASSUMPTION: `cyc.execute` sub-verbs `lock`, `release`, `extend` are added to the CTR-CAP-001 vocabulary (MINOR).
- [DECISIONS.md](../../../DECISIONS.md) D08 — PROVISIONAL (D08 default, unapproved): no offline lock acquisition.
