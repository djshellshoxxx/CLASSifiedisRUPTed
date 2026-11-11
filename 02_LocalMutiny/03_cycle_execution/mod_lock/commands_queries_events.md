# PS-023-04 — Commands, queries and events: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-04.R01** reserve produces classrup.bazaar.reservation/v1 through bazaar.inventory.issue_reservation and release produces the notice classrup.mutiny.reservation_release/v1; ingest verifies a peer's reservation or release notice and produces none; classrup.mutiny.cycle_lock/v1 is the local record only.
- **PS-023-04.R02** The reserve command takes all holds and writes the statement and event in one IndexedDB transaction, and it is idempotent.
- **PS-023-04.R03** Events locked and unlocked are emitted for own reservations and for verified peer reservations, with direction in the payload.
- **PS-023-04.R04** Statements registered with the F11.S01.M01 registry (N2): classrup.bazaar.reservation/v1 with holder.type cycle, signer role 'owner of the listed items and giver in the head revision' (ingest owner here, storage through F01.S03.M01 record_peer_reservation), and classrup.mutiny.reservation_release/v1, signer role 'signer of the released reservation'; statements from DIDs the principal blocked are dropped silently (N7).
- **PS-023-04.R05** This module is the single caller of the F01.S03.M01 InventoryPort for holderType cycle (hold, renew, release, convert); F01.S03.M01 does not act on mutiny events, and the unlocked event names holdIds for own locks.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.lock.reserve` | mutiny.lock.reserve | { subjectType, subjectId, revisionHash, items: { inventoryItemId, quantity }[1..5], consentDeadline, executionWindowMs, audience: did[] } — vault command; calls bazaar.inventory.hold {holder {type: cycle, id: subjectId}, ttlMs, lines} and bazaar.inventory.issue_reservation {holdIds, audience, expiresAt, ext {subjectType, revisionHash, supersedesCid?}}; produces statement classrup.bazaar.reservation/v1 signed by the principal | { lockId, reservationCid, expiresAt, holdIds, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_LOCK_UNAVAILABLE, MUTINY_LOCK_CONFLICT, MUTINY_LOCK_LIMIT, MUTINY_LOCK_EXPIRY_INVALID, MUTINY_LOCK_REVISION_STALE | mutiny.cycle.locked | yes (Idempotency-Key) |
| `mutiny.lock.release` | mutiny.lock.release | { lockId, expectedRevision, reason } — vault command; releases the holds with bazaar.inventory.release and produces the notice classrup.mutiny.reservation_release/v1 {releasesCid, holder, revisionHash, reason} signed by the principal | { lockId, revision, status: released, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | mutiny.cycle.unlocked | yes (Idempotency-Key) |
| `mutiny.lock.ingest` | mutiny.lock.ingest | { envelope: classrup.bazaar.reservation/v1 with holder.type cycle \| classrup.mutiny.reservation_release/v1, signed by the giver, provenance } — vault command; stores the reservation as evidence through bazaar.inventory.record_peer_reservation; produces no statement | { lockId?, accepted: boolean, status, quarantineReason? } | MUTINY_LOCK_STATEMENT_INVALID, MUTINY_LOCK_REVISION_STALE, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED, CONFLICT_STATE | mutiny.cycle.locked, mutiny.cycle.unlocked, mutiny.lock.conflict_detected | yes (Idempotency-Key) |
| `mutiny.lock.release_for_subject` | mutiny.lock.release_for_subject | { subjectType, subjectId, reason: declined\|withdrawn\|cancelled\|rejected\|expired\|fork_frozen\|subject_ended } — LockPort.releaseForSubject, internal vault port run inside the caller's transaction (F02.S01.M01, F02.S03.M01, F02.S03.M03); releases own active locks and holds and marks peer locks of the subject subject_ended; produces the release notices of own locks | { releasedOwn: int, closedPeer: int } | NOT_FOUND | mutiny.cycle.unlocked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.lock.get_for_subject` | mutiny.lock.read | { subjectType, subjectId } | { locks: CycleLock[], allGiversReserved: boolean, earliestExpiry?, holdRenewedUntil? } | NOT_FOUND |
| `mutiny.lock.list_active_own` | mutiny.lock.read | { cursor?, limit ≤ 50 } | { items: CycleLock[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.cycle.locked` | P2 | { lockId, reservationCid (the cid of the signed classrup.bazaar.reservation/v1), subjectType, subjectId, giverId, direction, revisionHash, itemCount, inventoryItemIds, expiresAt } |
| `mutiny.cycle.unlocked` | P2 | { lockId, subjectType, subjectId, giverId, direction, revisionHash, inventoryItemIds, holdIds? (own only), reason: released\|converted\|superseded\|expired\|item_lost\|conflict\|subject_ended } |
| `mutiny.lock.conflict_detected` | P2 | { giverId, inventoryItemId, subjectIds[2], lockIds[2], detectedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.cycle.declined` | release the principal's own reservations of the subject with reason declined and mark peer locks of the subject subject_ended |
| `mutiny.cycle.cancelled` | release the principal's own reservations with reason cancelled (idempotent after LockPort.releaseForSubject) and mark peer locks subject_ended |
| `mutiny.cycle.completed` | mark any remaining own reservation released with reason completed and peer locks subject_ended |
| `mutiny.cycle.partially_executed` | move own locks of legs without handover evidence to recovery_held (hold renewed locally, statement not re-signed); own locks of handed-over legs are already converted |
| `mutiny.recovery.resolved` | apply the recorded per-leg disposition to recovery_held locks, converting or releasing the remaining own holds |
| `mutiny.leg.handed_over` | for the principal's own attestation as giver, convert the hold of that leg's lock (the item left the owner's hands) |
| `mutiny.leg.received` | after verifying the receiver's signed attestation, convert the matching item holds and the lock when all its items are received, if not already converted |
| `mutiny.proposal.rejected` | release own reservations of the proposal and mark peer locks subject_ended |
| `mutiny.proposal.withdrawn` | release own reservations of the proposal and mark peer locks subject_ended |
| `mutiny.proposal.expired` | release own reservations of the proposal and mark peer locks subject_ended |
| `mutiny.revision.forked` | release own reservations of the frozen subject with reason fork_frozen |
| `bazaar.inventory.released` | if the released hold belongs to an active own reservation and was not released by this module, mark it expired with reason item_lost and emit unlocked |
| `bazaar.inventory.conflict_detected` | an own hold froze because two devices of the principal reserved the same unit; mark the affected own locks conflicted, release own locks of every named subject with fork_frozen and emit mutiny.lock.conflict_detected |
| `privacy.deletion.completed` | release remaining own holds of the erased principal and pseudonymize the erased DID in retained lock records; signed statements stay verifiable |

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
-> { "lockId":"0192f422-…", "reservationCid":"sha256-Rr4…", "expiresAt":"2026-11-21T10:00:00.000Z", "holdIds":["0192f423-…"], "syncState":"prepared" }
Bob, Carol and Dan do the same in their own vaults. Each vault's commit verdict needs all 4 reservation statements (2 for a 2-party, 3 for a 3-party, N for N-party).
A fifth statement naming Dan's item for another cycle triggers mutiny.lock.conflict_detected and freezes both subjects at the vault that sees both.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T07 | integration | PS-023-03.R02, PS-023-04.R03 | leg.received for all items, then for part of the items | lock converted only when all items received; holds converted in inventory |
| TEST-PS-023-09.T08 | contract | PS-023-04.R01, PS-023-04.R02, PS-023-09.R02, PS-023-04.R04 | commands and events | statements validate against classrup.bazaar.reservation/v1 (F01 schema, holder cycle) and classrup.mutiny.reservation_release/v1; no classrup.mutiny.cycle_lock/v1 envelope is ever sent; locked carries lockId, reservationCid and revisionHash; unlocked carries lockId, revisionHash and own holdIds |
| TEST-PS-023-09.T16 | integration | PS-023-04.R03, PS-023-01.R01 | 2-, 3-, 4- and 6-party fixtures | all-givers-reserved flag true only when every giver has a valid unexpired statement |
| TEST-PS-023-09.T19 | integration | PS-023-03.R02, PS-023-04.R05 | own handed_over attestation, then partially_executed with one undelivered own leg and a recovery lasting 40 days | handed-over leg converted at once; undelivered leg recovery_held with renewals up to maxExpiresAt, then expired and the RecoveryCase told |
| TEST-PS-023-09.T21 | integration | PS-023-06.R02, PS-023-04.R05 | LockPort.releaseForSubject inside a cancelling transaction that then aborts | holds and locks unchanged after abort; on commit holds released before the transaction ends |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
