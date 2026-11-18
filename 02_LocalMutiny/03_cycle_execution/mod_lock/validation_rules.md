# PS-023-02 — Validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-02.R01 | Lock request accepted only when the cycle version is CONSENTED (from mod_consent) and not superseded. | MVP |
| PS-023-02.R02 | Every item in the set exists, is listed, is owned by the declaring party, and has availability ≥ 1 per F01.S03.M01. | MVP |
| PS-023-02.R03 | Item set contains no duplicate `item_id` and no item of another party's listing not in the proposal snapshot. | MVP |
| PS-023-02.R04 | Extension request allowed only while HELD, extensions = 0, and total ≤ 48 h. | MVP |
| PS-023-02.R05 | Release requests must present the current `fence`; stale fence rejected. | MVP |
| PS-023-02.R06 | Lock set size ≤ 16 items; larger sets rejected with `CYC_LOCK.SET_TOO_LARGE` before any write. | MVP |

## Data / schema
Validates inputs against [domain_schema.md](domain_schema.md). Item set must equal the snapshot's item list (hash check, see mod_consent PS-021-02).

## Commands / queries / events
Validation precedes acquisition. See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Validation failures do not change lock state.

## Validation & errors
| Code | Retryable | Class / HTTP | User message key |
|---|---|---|---|
| CYC_LOCK.CYCLE_NOT_CONSENTED | false | conflict / 409 | lock.not_consented |
| CYC_LOCK.ITEM_UNAVAILABLE | true | conflict / 409 | lock.item_unavailable |
| CYC_LOCK.SET_MISMATCH | false | unprocessable_state / 422 | lock.set_mismatch |
| CYC_LOCK.SET_TOO_LARGE | false | validation / 400 | lock.set_too_large |
| CYC_LOCK.EXTENSION_LIMIT | false | conflict / 409 | lock.extension_limit |
| CYC_LOCK.STALE_FENCE | false | conflict / 409 | lock.stale |

`ITEM_UNAVAILABLE` never reveals which cycle holds the item.

## Authorization
Caller must be the system principal `sys_` for acquisition (see [authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Validation is deterministic. Re-validation happens inside the acquisition transaction to avoid time-of-check gaps.

## Privacy, retention, abuse
Error diagnostics contain item count and cycle state only.

## Observability & budgets
Counts per code; validation p95 ≤ 5 ms excluding database.

## Tests
- TEST-PS-023-02-01 (unit): each code reachable with minimal input.
- TEST-PS-023-02-02 (negative): item held by another cycle → ITEM_UNAVAILABLE without cycle ID.
- TEST-PS-023-02-03 (boundary): 16 items accepted, 17 rejected.

## Acceptance criteria
1. R01–R06 each covered by a passing and failing test.
2. No validation error discloses another cycle's ID.
3. Set-size limit enforced before any database write.

## Assumptions & open decisions
- ASSUMPTION: 16-item set limit (2 items per party up to 8 parties).
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved).
