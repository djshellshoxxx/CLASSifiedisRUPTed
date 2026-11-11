# PS-023-01 — Domain schema: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-01.R01** A CycleLock holds one giver's reserved item set for one subject, the revision hash it was made against, the absolute expiry, the direction own or peer and, for own reservations, the local inventory hold ids.
- **PS-023-01.R02** The record references the signed classrup.bazaar.reservation/v1 statement (by reservationCid) so peers' copies are verifiable evidence, and the own copy additionally links local holds that exist only in this vault; classrup.mutiny.cycle_lock/v1 names only this local record and is never sent (N14).
- **PS-023-01.R03** The statement's absolute expiresAt is never extended; the local inventory hold behind it is renewed internally under the same absolute expiry, and extending the promise means issuing a new reservation that supersedes the old one (supersedesCid) before it expires.

## Specification

### CycleLock

Schema `classrup.mutiny.cycle_lock/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key in the vault |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — trade_proposal \| cycle |
| subjectId | uuidv7 — holder id; the statement's holder is {type: cycle, id: subjectId}; for a proposal that becomes a cycle the cycle id equals the proposal id |
| giverId | did — signer of the reservation; owner of the items |
| kind | enum — reserve \| release |
| direction | enum — own \| peer |
| revisionHash | cid — head revision digest the reservation was made against, carried in the statement extension ext.revisionHash |
| items | array — 1..5 items {inventoryItemId uuidv7, listingId uuidv7, listingCid cid, variantId? uuidv7, quantity int 1..99, holdId? uuidv7}; inventoryItemId and quantity form the InventoryPort line {inventoryItemId, quantity}; listingId, listingCid and variantId are the statement item references; holdId only on own |
| expiresAt | timestamp — absolute; min(consentDeadline + executionWindowMs, issue time + 30 d), never extended; evaluated on the local clock |
| holdRenewedUntil? | timestamp — own only; current expiry of the local hold, renewed internally up to expiresAt and never past the hold's maxExpiresAt |
| issuedAtClaim | timestamp — signer's clock, a claim |
| status | enum — active \| recovery_held \| released \| converted \| expired \| superseded \| conflicted |
| releaseReason? | enum — declined \| withdrawn \| cancelled \| completed \| recovered \| item_lost \| fork_frozen \| superseded \| subject_ended |
| reservationCid | cid — cid of the classrup.bazaar.reservation/v1 statement (kind reserve) or of the release notice (kind release): classrup.mutiny.reservation_release/v1, the alias of classrup.bazaar.reservation_release/v1 |
| supersedesCid? | cid — earlier reservation of the same signer and subject that this one replaces (statement extension) |
| releasesCid? | cid — required when kind is release; the reservation the notice releases |
| sig | string — Ed25519 signature (base64url) per CTR-FED-001 FED-2 |
| provenance? | object — {originRelay?, receivedAt (local clock), via[], verifiedAt} for peer statements |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- An own reservation with status active has every item's holdId present and active in the local inventory, and all items were reserved in one transaction.
- At most one active CycleLock exists per (subjectId, giverId, direction); a new reserve supersedes the earlier one and names it in supersedesCid.
- expiresAt is never changed after creation; holdRenewedUntil ≤ expiresAt while active; status moves only forward and terminal states do not reopen.
- The sum of quantities of active own reservations for one inventory item never exceeds the item's available quantity.

### Storage DDL

```sql
CREATE TABLE mutiny_cycle_lock (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, giver_id TEXT NOT NULL, direction TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, reservation_cid TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX mutiny_lock_active ON mutiny_cycle_lock(tenant_id, subject_id, giver_id, direction) WHERE status = 'active';
CREATE UNIQUE INDEX mutiny_lock_cid ON mutiny_cycle_lock(tenant_id, reservation_cid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T01 | unit | PS-023-01.R01, PS-023-01.R03, PS-023-02.R01 | reserve I1 and I2 | InventoryPort lines mapped from the leg items, holds with holder {type: cycle, id: subjectId}, classrup.bazaar.reservation/v1 issued with ext.revisionHash, expiry equals deadline plus execution window |
| TEST-PS-023-09.T04 | integration | PS-023-06.R02, PS-023-01.R02, PS-023-09.R03 | two concurrent reserves of the same quantity-1 item for different subjects | exactly one succeeds, the other MUTINY_LOCK_CONFLICT without naming the first |
| TEST-PS-023-09.T16 | integration | PS-023-04.R03, PS-023-01.R01 | 2-, 3-, 4- and 6-party fixtures | all-givers-reserved flag true only when every giver has a valid unexpired statement |
| TEST-PS-023-09.T18 | integration | PS-023-03.R01, PS-023-01.R03 | 17-day reservation with injected clock across day 13 and day 17 | hold renewed once with bazaar.inventory.renew, no statement re-signed, lock expires at the absolute expiresAt |
| TEST-PS-023-09.T23 | contract | PS-023-04.R06, PS-023-04.R05, PS-023-01.R01 | reserve with lines {inventoryItemId, quantity} and audience [{did, mailboxId}]; release after decline, after fork_frozen and after an F01 release with reason deal_cancelled; ingest of an alias notice and of a bazaar release with holder cycle | hold and issue_reservation called with those shapes; notices typed classrup.mutiny.reservation_release/v1 with payload {releasesCid, holder {type: cycle, id}, reason} and reasons released, frozen and deal_cancelled; the registry resolves the alias to classrup.bazaar.reservation_release/v1; both notices release the peer lock and reach record_peer_reservation; no notice for converted locks or at the signed expiresAt |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
