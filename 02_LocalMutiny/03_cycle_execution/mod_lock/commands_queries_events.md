# PS-023-04 — Commands, queries and events: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-04.R01** reserve and release are vault commands that produce the signed statement classrup.mutiny.cycle_lock/v1 (kind reserve or release); ingest verifies a peer's statement and produces none.
- **PS-023-04.R02** The reserve command takes all holds and writes the statement and event in one IndexedDB transaction, and it is idempotent.
- **PS-023-04.R03** Events locked and unlocked are emitted for own reservations and for verified peer reservations, with direction in the payload.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.lock.reserve` | mutiny.lock.reserve | { subjectType, subjectId, revisionHash, items: { inventoryItemId, quantity }[1..5], consentDeadline, executionWindowMs } — vault command; produces statement classrup.mutiny.cycle_lock/v1 kind reserve signed by the principal | { lockId, cid, expiresAt, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_LOCK_UNAVAILABLE, MUTINY_LOCK_CONFLICT, MUTINY_LOCK_LIMIT, MUTINY_LOCK_EXPIRY_INVALID, MUTINY_LOCK_REVISION_STALE | mutiny.cycle.locked | yes (Idempotency-Key) |
| `mutiny.lock.release` | mutiny.lock.release | { lockId, expectedRevision, reason } — vault command; produces statement classrup.mutiny.cycle_lock/v1 kind release signed by the principal | { lockId, revision, status: released, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | mutiny.cycle.unlocked | yes (Idempotency-Key) |
| `mutiny.lock.ingest` | mutiny.lock.ingest | { envelope: classrup.mutiny.cycle_lock/v1 signed by the giver, provenance } — vault command; produces no statement | { lockId?, accepted: boolean, status, quarantineReason? } | MUTINY_LOCK_STATEMENT_INVALID, MUTINY_LOCK_REVISION_STALE, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.cycle.locked, mutiny.cycle.unlocked, mutiny.lock.conflict_detected | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.lock.get_for_subject` | mutiny.lock.read | { subjectType, subjectId } | { locks: CycleLock[], allGiversReserved: boolean, earliestExpiry? } | NOT_FOUND |
| `mutiny.lock.list_active_own` | mutiny.lock.read | { cursor?, limit ≤ 50 } | { items: CycleLock[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.locked` | P2 | { subjectType, subjectId, giverId, direction, itemCount, inventoryItemIds, expiresAt } |
| `mutiny.cycle.unlocked` | P2 | { subjectType, subjectId, giverId, direction, inventoryItemIds, reason: released\|converted\|superseded\|expired\|item_lost\|conflict } |
| `mutiny.lock.conflict_detected` | P2 | { giverId, inventoryItemId, subjectIds[2], detectedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.declined` | release the principal's own reservations of the subject with reason declined |
| `mutiny.cycle.cancelled` | release the principal's own reservations with reason cancelled |
| `mutiny.cycle.completed` | mark any remaining own reservation released with reason completed |
| `mutiny.cycle.partially_executed` | release own reservations for legs without handover evidence; keep reservations of handed-over but unreceived legs until recovery resolves |
| `mutiny.recovery.resolved` | apply the recorded per-leg disposition, converting or releasing remaining own holds |
| `mutiny.leg.received` | after verifying the receiver's signed attestation, convert the matching item holds and the lock when all its items are received |
| `mutiny.proposal.rejected` | release own reservations of the proposal |
| `mutiny.proposal.withdrawn` | release own reservations of the proposal |
| `mutiny.proposal.expired` | release own reservations of the proposal |
| `mutiny.revision.forked` | release own reservations of the frozen subject with reason fork_frozen |
| `bazaar.inventory.released` | if the released hold belongs to an active own reservation, mark it expired with reason item_lost and emit unlocked |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_LOCK_UNAVAILABLE | 409 | no | an own item is not available in the requested quantity; nothing was reserved |
| MUTINY_LOCK_CONFLICT | 409 | no | the item is already reserved for another subject in this vault or a conflicting peer promise exists |
| MUTINY_LOCK_LIMIT | 409 | no | the vault already has 5 active reservation sets |
| MUTINY_LOCK_EXPIRY_INVALID | 422 | no | requested expiry is outside the allowed range |
| MUTINY_LOCK_REVISION_STALE | 409 | no | the revision hash is not the subject's head |
| MUTINY_LOCK_STATEMENT_INVALID | 422 | no | a reservation statement failed signature, signer, expiry or claimed-time checks |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# N-party cycle of 4: each giver reserves their own single item; Alice (coordinator) first
mutiny.lock.reserve  Idempotency-Key: 0192f420-0000-7000-8000-000000000001
{ "subjectType":"cycle", "subjectId":"0192f400-…", "revisionHash":"sha256-Zk8…", "items":[{"inventoryItemId":"0192f421-…","quantity":1}],
  "consentDeadline":"2026-11-07T10:00:00.000Z", "executionWindowMs":1209600000 }
-> { "lockId":"0192f422-…", "cid":"sha256-Rr4…", "expiresAt":"2026-11-21T10:00:00.000Z", "syncState":"prepared" }
Bob, Carol and Dan do the same in their own vaults. Each vault's commit verdict needs all 4 reservation statements (2 for a 2-party, 3 for a 3-party, N for N-party).
A fifth statement naming Dan's item for another cycle triggers mutiny.lock.conflict_detected and freezes both subjects at the vault that sees both.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T07 | integration | PS-023-03.R02, PS-023-04.R03 | leg.received for all items, then for part of the items | lock converted only when all items received; holds converted in inventory |
| TEST-PS-023-09.T08 | contract | PS-023-04.R01, PS-023-04.R02, PS-023-09.R02 | commands and events | statements and event payloads validate against classrup.mutiny.cycle_lock/v1 and registry |
| TEST-PS-023-09.T16 | integration | PS-023-04.R03, PS-023-01.R01 | 2-, 3-, 4- and 6-party fixtures | all-givers-reserved flag true only when every giver has a valid unexpired statement |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
