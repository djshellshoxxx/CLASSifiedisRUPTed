# PS-008-04 — Commands, queries and events: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-04.R01** hold, release, renew, convert and set_quantity are vault-local commands; issue_reservation is vault-local and produces the signed statement classrup.bazaar.reservation/v1 through federation.record.publish; record_peer_reservation stores an incoming statement that F11.S01.M02 verified.
- **PS-008-04.R02** The InventoryPort for other modules consists of bazaar.inventory.hold, release, renew, convert, set_quantity, bazaar.inventory.check and bazaar.inventory.get_item, called inside the caller's own transaction when it runs in the same vault.
- **PS-008-04.R03** No command contacts a relay; relays only carry reservation statements as end-to-end encrypted envelopes when a counterparty needs them.
- **PS-008-04.R04** Releasing or freezing a hold before its expiresAt queues the signed classrup.bazaar.reservation_release/v1 {releasesCid, holder, reason} to the audience of every reservation issued for it (for holderType cycle F02.S03.M02 sends its own notice); receiving vaults mark their PeerReservation released or frozen.
- **PS-008-04.R05** set_quantity is a synchronous upsert inside the caller's transaction: it creates the per-variant InventoryItem when missing and supersedes the listing-level item when the first variant item is created; bazaar.variant.changed never creates items.
- **PS-008-04.R06** Reservation and release statements are participant statements published only through the StatementPublisherPort (F11.S01.M02 federation.record.publish {type, audience participants, payload: ciphertext of at most 12288 bytes sealed to the recipients, recipients [{did, mailboxId}], stream thr:<opaque id>}), which signs, allocates seq and prev and routes them to the recipients' mailboxes; receipt is acknowledged by the recipient's F11.S01.M02 with classrup.federation.ack/v1, and this module signs no acknowledgement of its own.
- **PS-008-04.R07** The module consumes federation.conflict.detected and federation.conflict.resolved (candidateCids, statementClass, freezeScope) for classrup.bazaar.reservation/v1, freezing and releasing the named holds, and confirms its F11.S01.M01 commitment entry with subject key reservation:<listingId>:<variantId or _> and the allocationSeq-based overlap test; it does not act on mutiny events.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.inventory.hold` | bazaar.inventory.hold | [vault-local, port] { holder: { type, id }, ttlMs? (default 900000), maxExpiresAt? (<= now + 30 d), linkedDealId?, lines: [{ listingId, variantId?, quantity } \| { inventoryItemId, quantity }] (1..20) } | { holds: [{ holdId, inventoryItemId, listingId, variantId?, quantity, expiresAt, maxExpiresAt }] } | VALIDATION_FAILED, FORBIDDEN, BAZAAR_INVENTORY_NOT_HOLDABLE, BAZAAR_INVENTORY_INSUFFICIENT, BAZAAR_INVENTORY_HOLD_LIMIT, BAZAAR_INVENTORY_FROZEN, DEPENDENCY_UNAVAILABLE | bazaar.inventory.held, bazaar.inventory.depleted | yes (Idempotency-Key) |
| `bazaar.inventory.release` | bazaar.inventory.release | [vault-local, port + statement classrup.bazaar.reservation_release/v1 published through federation.record.publish to the reservation audience when reservations were issued] { holder: { type, id } \| holdIds[], reason: released\|owner_override\|deal_cancelled\|listing_gone } | { released: int, releaseCids[] } | NOT_FOUND, CONFLICT_STATE | bazaar.inventory.released, bazaar.inventory.restocked | yes (Idempotency-Key) |
| `bazaar.inventory.renew` | bazaar.inventory.renew | [vault-local, port] { holder: { type, id }, ttlMs } — cycle holds only from F02.S03.M02, up to maxExpiresAt; issued reservations keep their signed expiresAt | { holds: [{ holdId, expiresAt, renewals }] } | NOT_FOUND, CONFLICT_STATE, EXPIRED, BAZAAR_INVENTORY_HOLD_LIFETIME, BAZAAR_INVENTORY_FROZEN, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `bazaar.inventory.convert` | bazaar.inventory.convert | [vault-local, port] { holder: { type, id } \| linkedDealId } | { converted: int, onHand } | NOT_FOUND, CONFLICT_STATE, EXPIRED, BAZAAR_INVENTORY_FROZEN, DEPENDENCY_UNAVAILABLE | bazaar.inventory.converted, bazaar.inventory.depleted | yes (Idempotency-Key) |
| `bazaar.inventory.set_quantity` | bazaar.inventory.adjust | [vault-local, port, synchronous upsert] { listingId, variantId?, onHand, expectedRevision? } | { itemId, created: boolean, supersededItemId?, onHand, available, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_INVENTORY_BELOW_RESERVED | bazaar.inventory.depleted, bazaar.inventory.restocked | yes (Idempotency-Key) |
| `bazaar.inventory.issue_reservation` | bazaar.inventory.issue_reservation | [vault-local; statement classrup.bazaar.reservation/v1 published by F11.S01.M02 federation.record.publish (audience participants)] { holdId \| holdIds[1..20] (several lines of one holder) \| holder: { type, id } (all its active holds, for example {type: cycle, id}), audience: [{ did, mailboxId }] (1..10), stream? (thr:<opaque id>; default derived from the holder), expiresAt? (absolute; default the holds' maxExpiresAt for Deal-linked holds, else their expiresAt; for holderType cycle any time up to the holds' maxExpiresAt, also beyond their current expiresAt; never above maxExpiresAt), ext? { subjectType?, revisionHash?, supersedesCid? } } | { reservationCid, seq, expiresAt } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED, BAZAAR_INVENTORY_FROZEN, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `bazaar.inventory.record_peer_reservation` | bazaar.inventory.record_peer | [vault-local] { statement: classrup.bazaar.reservation/v1 \| classrup.bazaar.reservation_release/v1 envelope verified by F11.S01.M02 (which also signs the classrup.federation.ack/v1 to the issuer), provenance } | { peerReservationId?, accepted: boolean, status?, quarantineReason?: signature_invalid\|signer_not_listing_author\|unknown_reservation\|duplicate } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.inventory.check` | bazaar.inventory.read | { lines: [{ listingId, variantId?, quantity } \| { inventoryItemId, quantity }] (1..20) } | { ok: boolean, lines: [{ listingId, variantId?, available, ok }] } | VALIDATION_FAILED |
| `bazaar.inventory.get_item` | bazaar.inventory.read | { listingId, variantId? } \| { inventoryItemId } | { item: InventoryItem, reserved, available } | NOT_FOUND |
| `bazaar.inventory.list_holds` | bazaar.inventory.read | { listingId?, status?, holderType?, linkedDealId?, cursor?, limit <= 50 } | { items: InventoryHold[], nextCursor? } | VALIDATION_FAILED |
| `bazaar.inventory.list_peer_reservations` | bazaar.inventory.read_peer | { issuerDid?, listingId?, holder?, status?, cursor?, limit <= 50 } | { items: PeerReservation[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.inventory.held` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, linkedDealId?, expiresAt } |
| `bazaar.inventory.released` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, linkedDealId?, reason: released\|expired\|owner_override\|listing_gone\|deal_cancelled, releaseCid? } |
| `bazaar.inventory.depleted` | P2 | { listingId, variantId?, reason: held\|sold } |
| `bazaar.inventory.restocked` | P2 | { listingId, variantId?, available } |
| `bazaar.inventory.converted` | P2 | { holdId, listingId, variantId?, quantity, holderType, holderId, linkedDealId?, onHand } |
| `bazaar.inventory.conflict_detected` | P2 | { listingId, variantId?, holdIds[], holders[{type, id}], linkedDealIds[], reason: forked_reservation } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.created` | create the listing-level InventoryItem with onHand 1 for kinds sell, giveaway and rental; none for wanted, service and auction |
| `bazaar.listing.archived` | release active local holds with reason listing_gone and queue signed releases, unless a Deal is linked or holderType is cycle |
| `bazaar.listing.deleted` | delete InventoryItem and non-converted holds of the listing; evidence holds stay under RET-EVIDENCE |
| `bazaar.variant.changed` | retired: set retiredAt on the variant item; reactivated: clear retiredAt; removed: delete the item when it has no active or frozen hold; no item is created here (creation is synchronous through set_quantity) |
| `commerce.deal.completed` | convert the hold whose linkedDealId equals the event dealId |
| `federation.conflict.detected` | statementClass commitment for classrup.bazaar.reservation/v1: freeze every active hold whose reservationCids intersect candidateCids or whose reservation subject is in freezeScope, publish signed releases with reason frozen (not for cycle) and emit bazaar.inventory.conflict_detected |
| `federation.conflict.resolved` | drop_all: release the frozen holds of the conflict with reason owner_override; superseded: keep the hold whose superseding reservation names the candidates and release the others; nothing is decided by time |
| `commerce.deal.cancelled` | release active or frozen holds whose linkedDealId equals the event dealId with reason deal_cancelled and queue the signed release to their reservation audience |
| `privacy.deletion.completed` | replace the deleted principal's DID with the payload pseudonym in RET-EVIDENCE holds (reservation audience) and in PeerReservation records |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_INVENTORY_NOT_HOLDABLE | 409 | no | item missing, superseded, retired, not owned locally, or listing not in a holdable state |
| BAZAAR_INVENTORY_INSUFFICIENT | 409 | no | fewer units available than requested for at least one line; nothing was held |
| BAZAAR_INVENTORY_HOLD_LIMIT | 409 | no | vault already has 500 active holds |
| BAZAAR_INVENTORY_HOLD_LIFETIME | 409 | no | renewal would exceed 30 days total life, maxExpiresAt or 20 renewals |
| BAZAAR_INVENTORY_BELOW_RESERVED | 409 | no | on-hand cannot go below the reserved quantity |
| BAZAAR_INVENTORY_FROZEN | 409 | no | hold or reservation subject is frozen by a conflict detected by F11.S02.M03 and needs an owner decision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements (N2, N14, registered with F11.S01.M01): classrup.bazaar.reservation/v1 {holder {type, id}, items [{listingId, listingCid?, variantId?, quantity, allocationSeq}] (1..20), expiresAt (absolute), ext? {subjectType, revisionHash, supersedesCid}}, audience participants, acknowledger counterparty, signer role listing author (owner of the listed items; for holderType cycle also a giver in the head revision, checked by F02.S03.M02); classrup.bazaar.reservation_release/v1 {releasesCid, holder, reason: released|owner_override|listing_gone|deal_cancelled|frozen|conflict_resolved}, signer role signer of the released reservation. Both are published only through the StatementPublisherPort (federation.record.publish, sealed ciphertext <= 12288 bytes, recipients [{did, mailboxId}], stream thr:<opaque id>) and acknowledged by the recipients' F11.S01.M02 with classrup.federation.ack/v1. Commitment entry confirmed for F11.S01.M01: subject key reservation:<listingId>:<variantId or _>; two verified reservations conflict when the same signer names the same listingId, variantId and allocationSeq for different holders, both are before expiresAt and neither has a verified release. classrup.mutiny.cycle_lock/v1 is not a statement and classrup.mutiny.reservation_release/v1 is the cycle release notice sent by F02.S03.M02. Statements from blocked DIDs are dropped silently (N7). Privacy ports (N6): the module registers ExportSectionPort (sections bazaar.inventory_items, bazaar.inventory_holds and bazaar.peer_reservations), DeletionPort (plan: release own non-evidence holds, pseudonymize counterparty DIDs in retained evidence) and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
vault.dispatch("bazaar.inventory.hold", { "holder": { "type": "offer", "id": "0192f3a5-..." }, "ttlMs": 604800000,
  "maxExpiresAt": "2026-12-04T10:00:00.000Z", "linkedDealId": "0192f3a6-dddd-...",
  "lines": [ { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "quantity": 1 } ] }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000051")
=> { "holds": [ { "holdId": "0192f3a6-...", "inventoryItemId": "0192f3a4-aaaa-...", "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "quantity": 1,
     "expiresAt": "2026-11-11T10:00:00.000Z", "maxExpiresAt": "2026-12-04T10:00:00.000Z" } ] }
vault.dispatch("bazaar.inventory.issue_reservation", { "holder": { "type": "offer", "id": "0192f3a5-..." }, "audience": [{ "did": "did:key:z6MkBuyer...", "mailboxId": "mbx_7Hq..." }], "stream": "thr:Hk2Qm..." })
=> { "reservationCid": "sha256-Zm9v...", "seq": 41, "expiresAt": "2026-12-04T10:00:00.000Z" }   (published by F11.S01.M02 federation.record.publish, audience participants)
later commerce.deal.cancelled { dealId: "0192f3a6-dddd-..." } => hold released (deal_cancelled), classrup.bazaar.reservation_release/v1 queued to the buyer
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T07 | contract | PS-008-04.R01, PS-008-04.R02, PS-008-09.R02 | each command and the reservation and release statements | outputs, events and statements validate; signature verifies with owner key |
| TEST-PS-008-09.T08 | integration | PS-008-04.R03, PS-008-07.R02 | reservation travels via relay mailbox | relay sees ciphertext and routing metadata only; no network call from hold/release/convert |
| TEST-PS-008-09.T22 | integration | PS-008-04.R04 | release with owner_override and listing archive before expiresAt for a hold with an issued reservation; B1 receives the release | releaseCid set and statement queued to the audience; B1's PeerReservation becomes released; cycle holds queue no bazaar release |
| TEST-PS-008-09.T23 | integration | PS-008-04.R05 | F01.S03.M02 adds the first variant of L inside its transaction via set_quantity, then a second variant | variant item created synchronously and the listing-level item superseded in the same transaction; with an active listing-level hold CONFLICT_STATE; bazaar.variant.changed creates nothing |
| TEST-PS-008-09.T26 | contract | PS-008-04.R06 | issue a reservation and a release through the StatementPublisherPort test double; B1 receives the reservation | both created by federation.record.publish with audience participants, recipients [{did, mailboxId}], stream thr:<id> and a ciphertext of at most 12288 bytes (12289 refused with PAYLOAD_TOO_LARGE); the module calls no signing primitive; B1's F11.S01.M02 signs classrup.federation.ack/v1 and S's entry reaches peer_accepted |
| TEST-PS-008-09.T27 | integration | PS-008-04.R07, PS-008-02.R05 | federation.conflict.detected names a reservation of L, then hold, renew, convert and issue_reservation are attempted; then the conflict store fails; then federation.conflict.resolved drop_all | the hold freezes and each action is refused with BAZAAR_INVENTORY_FROZEN; with the failing store each refuses with DEPENDENCY_UNAVAILABLE; drop_all releases the frozen hold; no mutiny event is consumed |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
