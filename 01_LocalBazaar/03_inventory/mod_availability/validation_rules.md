# PS-008-02 — Validation rules: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-02.R01** Quantities, lease times and line counts are bounded and validated before any change.
- **PS-008-02.R02** A hold is accepted only when enough local availability exists for every line; otherwise nothing is held.
- **PS-008-02.R03** Every violation maps to one stable error code.
- **PS-008-02.R04** Hold lines accept {listingId, variantId?} or {inventoryItemId}; holderType cycle is accepted only from F02.S03.M02, the single driver of cycle holds, with holder {type, id} taken from the lock subject (N14).
- **PS-008-02.R05** Before hold, renew, convert and issue_reservation the module calls federation.conflict.is_frozen (F11.S02.M03) synchronously for the reservation subject key of every affected item; frozen refuses with BAZAAR_INVENTORY_FROZEN and a store that cannot answer refuses with DEPENDENCY_UNAVAILABLE, so a freeze never fails open.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | quantity is an integer 1..100000 for hold lines and 0..100000 for set_quantity | VALIDATION_FAILED |
| V02 | 1 to 20 lines per hold call; no duplicate item after resolving inventoryItemId lines | VALIDATION_FAILED |
| V03 | ttlMs between 60000 and 1209600000 | VALIDATION_FAILED |
| V04 | every line's item exists, is owned by the local principal and is neither superseded nor retired | BAZAAR_INVENTORY_NOT_HOLDABLE |
| V05 | listing status is published, or unpublished when holderType is deal or cycle with an existing signed commitment or the hold has linkedDealId | BAZAAR_INVENTORY_NOT_HOLDABLE |
| V06 | available >= quantity for every line | BAZAAR_INVENTORY_INSUFFICIENT |
| V07 | the vault has fewer than 500 active holds | BAZAAR_INVENTORY_HOLD_LIMIT |
| V08 | renewal keeps expiresAt <= maxExpiresAt and renewals < 20 | BAZAAR_INVENTORY_HOLD_LIFETIME |
| V09 | set_quantity does not drop onHand below reserved quantity | BAZAAR_INVENTORY_BELOW_RESERVED |
| V10 | hold is not frozen when converting or renewing | BAZAAR_INVENTORY_FROZEN |
| V11 | peer reservation or release statement: signature verifies Ed25519 over JCS and the signer is the author of the verified listing projection (F11.S01.M02) of the referenced listing; a release binds the reservationCid of a stored PeerReservation of the same issuer | VALIDATION_FAILED |
| V12 | an inventoryItemId line resolves to an item of this vault owned by the local principal | BAZAAR_INVENTORY_NOT_HOLDABLE |
| V13 | holder.type is offer, negotiation, deal, cycle or giveaway and the caller owns that type (cycle only from F02.S03.M02) | FORBIDDEN |
| V14 | maxExpiresAt, when given, is >= the first expiresAt and <= now + 30 d | VALIDATION_FAILED |
| V15 | set_quantity creating the first variant item of a listing supersedes the listing-level item only when it has no active or frozen hold | CONFLICT_STATE |
| V16 | hold, renew, convert and issue_reservation: federation.conflict.is_frozen({subjectRef: reservation:<listingId>:<variantId or _>}) returns frozen false for every affected item | BAZAAR_INVENTORY_FROZEN |
| V17 | federation.conflict.is_frozen answers; a store that cannot be read refuses the action (fail closed) | DEPENDENCY_UNAVAILABLE |
| V18 | issue_reservation: all named holds belong to one holder and are active; expiresAt is absolute, later than now and <= the smallest maxExpiresAt of the holds; for holderType cycle it may exceed the holds' current expiresAt, for other holder types it equals their expiresAt or, for Deal-linked holds, their maxExpiresAt | VALIDATION_FAILED |
| V19 | issue_reservation audience has 1..10 entries {did, mailboxId} and the sealed reservation or release payload is at most 12288 bytes | PAYLOAD_TOO_LARGE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T01 | unit | PS-008-01.R01, PS-008-01.R02, PS-008-02.R01, PS-008-02.R02 | hold 1 of L; hold 1 more | first held with expiry, second BAZAAR_INVENTORY_INSUFFICIENT; available never negative |
| TEST-PS-008-09.T03 | unit | PS-008-02.R03 | violate each rule V01-V19 | documented error code returned and no state change |
| TEST-PS-008-09.T14 | abuse | PS-008-02.R01 | 201 hold commands in one hour | 201st returns RATE_LIMITED; holds above 14 d ttl refused |
| TEST-PS-008-09.T19 | contract | PS-008-02.R04 | F02.S03.M02 holds by inventoryItemId with holder {type: cycle, id: subjectId}; F01.S04.M01 requests holderType cycle | first succeeds with lines resolved; second FORBIDDEN |
| TEST-PS-008-09.T25 | integration | PS-008-03.R06, PS-008-02.R05 | F02.S03.M02 holds two lines of M with holder {type: cycle, id} and ttl 14 d, issues one reservation for both holdIds with expiresAt day 17 and ext {subjectType, revisionHash}; then expiresAt day 31; then renews on day 13 | first published with both items and the absolute day-17 expiresAt; day 31 refused with VALIDATION_FAILED (above maxExpiresAt); the renewal extends the holds without re-signing or changing the statement |
| TEST-PS-008-09.T27 | integration | PS-008-04.R07, PS-008-02.R05 | federation.conflict.detected names a reservation of L, then hold, renew, convert and issue_reservation are attempted; then the conflict store fails; then federation.conflict.resolved drop_all | the hold freezes and each action is refused with BAZAAR_INVENTORY_FROZEN; with the failing store each refuses with DEPENDENCY_UNAVAILABLE; drop_all releases the frozen hold; no mutiny event is consumed |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
