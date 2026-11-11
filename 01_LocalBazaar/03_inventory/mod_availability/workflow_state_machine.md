# PS-008-03 — Workflow state machine: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-03.R01** InventoryHold follows the declared machine; converted, released and expired are terminal and a new hold must be requested for new needs.
- **PS-008-03.R02** Hold, release, convert and renew each run in one IndexedDB transaction with the availability check, so concurrent callers in this vault are serialized.
- **PS-008-03.R03** A frozen hold stays frozen until the owner decides or it expires; conflicting signed reservations are never resolved by timestamp or last writer.
- **PS-008-03.R04** Frozen holds expire at expiresAt or maxExpiresAt exactly like active ones, so no hold or reservation stays frozen forever.
- **PS-008-03.R05** A hold with linkedDealId is renewed by the lease sweep in steps of at most 7 days up to maxExpiresAt (the Deal expiry, at most 30 days) while the Deal is open, is released with reason deal_cancelled on commerce.deal.cancelled and converted on commerce.deal.completed (N5).
- **PS-008-03.R06** A cycle hold is renewed only by F02.S03.M02 through bazaar.inventory.renew, in steps of at most 14 days up to maxExpiresAt (default 30 days after creation), and a renewal never re-signs or changes the expiresAt of a reservation already issued for it; a cycle reservation may therefore name an absolute expiresAt beyond the hold's current expiresAt, up to maxExpiresAt.

## Specification

### InventoryHold lifecycle

Initial **active**; terminal **converted**, **released**, **expired**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| active -> active | lease sweep renews a hold with linkedDealId whose Deal is still open, or bazaar.inventory.renew by the holder (F02.S03.M02 for cycle holds) after is_frozen returns false | expiresAt extended by at most 7 d (renew: ttl, at most 14 d) up to maxExpiresAt; renewals + 1; issued reservations are not re-signed |
| active -> converted | bazaar.inventory.convert by holder, or commerce.deal.completed for linkedDealId | onHand reduced by quantity; emits bazaar.inventory.converted; emits depleted if available becomes 0 |
| active -> released | bazaar.inventory.release by holder or owner, or commerce.deal.cancelled for linkedDealId | quantity returns to availability; signed release queued to the reservation audience (not for cycle); emits bazaar.inventory.released |
| active -> expired | lease sweep when expiresAt <= now | emits bazaar.inventory.released with reason expired |
| active -> frozen | federation.conflict.detected for classrup.bazaar.reservation/v1 whose candidates include a reservationCid of this hold or whose freezeScope names its reservation subject (two reservations of the principal's devices with the same allocationSeq to different holders) | signed release with reason frozen published to the reservation audience (not for cycle); emits bazaar.inventory.conflict_detected |
| frozen -> released | owner chooses to drop this hold (release owner_override), federation.conflict.resolved with decision drop_all, or commerce.deal.cancelled for linkedDealId | emits bazaar.inventory.released |
| frozen -> active | owner keeps this hold after releasing the conflicting one and issues a superseding reservation naming both candidate cids (federation.conflict.resolved superseded) | availability rechecked with a new allocationSeq; the new reservation carries supersedesCid |
| frozen -> expired | expiresAt or maxExpiresAt reached | emits bazaar.inventory.released with reason expired |

```mermaid
stateDiagram-v2
  [*] --> active
  active --> active: lease sweep renews a hold with linkedDealId whose Deal is still open, or bazaar.inventory.renew by the holder (F02.S03.M02 for cycle holds) after is_frozen returns false
  active --> converted: bazaar.inventory.convert by holder, or commerce.deal.completed for linkedDealId
  active --> released: bazaar.inventory.release by holder or owner, or commerce.deal.cancelled for linkedDealId
  active --> expired: lease sweep when expiresAt <= now
  active --> frozen: federation.conflict.detected for classrup.bazaar.reservation/v1 whose candidates include a reservationCid of this hold or whose freezeScope names its reservation subject (two reservations of the principal's devices with the same allocationSeq to different holders)
  frozen --> released: owner chooses to drop this hold (release owner_override), federation.conflict.resolved with decision drop_all, or commerce.deal.cancelled for linkedDealId
  frozen --> active: owner keeps this hold after releasing the conflicting one and issues a superseding reservation naming both candidate cids (federation.conflict.resolved superseded)
  frozen --> expired: expiresAt or maxExpiresAt reached
  converted --> [*]
  released --> [*]
  expired --> [*]
```

### PeerReservation lifecycle

Initial **valid**; terminal **released**, **expired**, **superseded**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| valid -> released | verified classrup.bazaar.reservation_release/v1 from the issuer binding reservationCid | shown as released by the issuer |
| valid -> frozen | verified release from the issuer with reason frozen | shown as under conflict; not relied on |
| valid -> expired | expiresAt passed on this vault's clock | shown as expired |
| valid -> superseded | verified newer reservation from the same issuer naming this cid in supersedesCid | the newer one is shown |
| frozen -> released | verified release from the issuer with any reason other than frozen | shown as released |
| frozen -> superseded | verified newer reservation from the issuer naming this cid in supersedesCid | conflict resolved by the issuer |
| frozen -> expired | expiresAt passed on this vault's clock | shown as expired |

```mermaid
stateDiagram-v2
  [*] --> valid
  valid --> released: verified classrup.bazaar.reservation_release/v1 from the issuer binding reservationCid
  valid --> frozen: verified release from the issuer with reason frozen
  valid --> expired: expiresAt passed on this vault's clock
  valid --> superseded: verified newer reservation from the same issuer naming this cid in supersedesCid
  frozen --> released: verified release from the issuer with any reason other than frozen
  frozen --> superseded: verified newer reservation from the issuer naming this cid in supersedesCid
  frozen --> expired: expiresAt passed on this vault's clock
  released --> [*]
  expired --> [*]
  superseded --> [*]
```

### Timeouts and scheduled transitions

- Lease sweep every 30 s while the app is open and at app start: active and frozen holds with expiresAt <= now become expired; Deal-linked active holds with less than 24 h left are renewed first while their Deal is open.
- Default hold ttl 15 minutes (IDM-3); accepted offers and negotiations use 7 days with linkedDealId and maxExpiresAt = Deal expiry; giveaway selections 72 h; cycle locks up to 14 days per renewal; maximum total life 30 days.
- PeerReservation expiry is evaluated on vault open and every 60 s while open.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T04 | property | PS-008-03.R01, PS-008-03.R02 | random hold/release/renew/convert/clock sequences | only declared transitions; onHand >= reserved; converted exactly once |
| TEST-PS-008-09.T05 | integration | PS-008-03.R02, PS-008-06.R02 | two tabs hold the last unit concurrently | exactly one hold succeeds, other gets INSUFFICIENT |
| TEST-PS-008-09.T06 | integration | PS-008-03.R03, PS-008-06.R02 | D2 holds the same last unit offline then syncs | F11.S02.M03 emits federation.conflict.detected for the two reservations with the same allocationSeq; both holds frozen, conflict event with linkedDealIds emitted, convert refused with BAZAAR_INVENTORY_FROZEN until owner releases one |
| TEST-PS-008-09.T20 | property | PS-008-03.R04 | frozen holds under clock advance without owner decision | every frozen hold reaches expired at expiresAt or maxExpiresAt and emits released with reason expired |
| TEST-PS-008-09.T21 | integration | PS-008-03.R05 | hold for Deal D with ttl 7 d and maxExpiresAt 30 d; advance to day 6; then commerce.deal.cancelled for D | hold renewed by the sweep before lapsing; on cancellation released with reason deal_cancelled and a signed release queued to the buyer |
| TEST-PS-008-09.T25 | integration | PS-008-03.R06, PS-008-02.R05 | F02.S03.M02 holds two lines of M with holder {type: cycle, id} and ttl 14 d, issues one reservation for both holdIds with expiresAt day 17 and ext {subjectType, revisionHash}; then expiresAt day 31; then renews on day 13 | first published with both items and the absolute day-17 expiresAt; day 31 refused with VALIDATION_FAILED (above maxExpiresAt); the renewal extends the holds without re-signing or changing the statement |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F11.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
