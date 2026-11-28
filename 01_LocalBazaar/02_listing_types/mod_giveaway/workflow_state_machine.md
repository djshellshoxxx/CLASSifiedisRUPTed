# PS-005-03 — Workflow state machine: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-03.R01** GiveawayRequest follows the declared machine; collected, declined, withdrawn and expired are terminal.
- **PS-005-03.R02** Selecting a recipient is atomic with the inventory hold; if the hold fails, the request stays pending.
- **PS-005-03.R03** A selected request that is not collected within 72 hours expires and releases its hold, making the unit selectable again; no cross-vault lock is claimed.
- **PS-005-03.R04** The requester vault changes a request to selected or declined only on a verified statement signed by the listing author for that exact request, and expires a selection at selectedUntil by its own clock.
- **PS-005-03.R05** Queue order is the order in which the giver's device received requests: requests from one mailbox sync batch or within 60 s of each other are tied and ordered by a giver-local random draw, first-come picks need one giver confirmation, and the UI labels the order as influenced by relays.

## Specification

### GiveawayRequest (giver vault) lifecycle

Initial **pending**; terminal **collected**, **declined**, **withdrawn**, **expired**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| pending -> selected | bazaar.giveaway_request.select by giver; in first_come mode the vault proposes the head of the queue (receipt order, tie groups by draw) and the pick is applied only with the giver's confirmation | inventory hold (holder {type: giveaway, id: requestId}, ttl 72 h) taken in same transaction; selection statement signed; emits bazaar.giveaway.recipient_selected |
| pending -> declined | bazaar.giveaway_request.decline by giver, giveaway full, closed or sold out | signed decline statement queued |
| pending -> withdrawn | verified withdrawal statement from the requester | no event |
| pending -> expired | giveaway closed or closesAt reached | no event |
| selected -> collected | bazaar.giveaway_request.confirm_collected by giver | inventory hold converted; optional recipient mark recorded when it arrives |
| selected -> withdrawn | verified withdrawal statement from the recipient | hold released |
| selected -> expired | selectedUntil reached | hold released; giver may select again |

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> selected: bazaar.giveaway_request.select by giver  in first_come mode the vault proposes the head of the queue (receipt order, tie groups by draw) and the pick is applied only with the giver's confirmation
  pending --> declined: bazaar.giveaway_request.decline by giver, giveaway full, closed or sold out
  pending --> withdrawn: verified withdrawal statement from the requester
  pending --> expired: giveaway closed or closesAt reached
  selected --> collected: bazaar.giveaway_request.confirm_collected by giver
  selected --> withdrawn: verified withdrawal statement from the recipient
  selected --> expired: selectedUntil reached
  collected --> [*]
  declined --> [*]
  withdrawn --> [*]
  expired --> [*]
```

### GiveawayRequest (requester vault) lifecycle

Initial **pending**; terminal **collected**, **declined**, **withdrawn**, **expired**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| pending -> selected | bazaar.giveaway_selection.receive verifies a selection signed by the listing author for this requestId and requestCid (V12) | selectedUntil and pickup note shown; replayed or foreign selections are quarantined |
| pending -> declined | bazaar.giveaway_selection.receive verifies a decline signed by the listing author for this request | shows declined |
| pending -> withdrawn | bazaar.giveaway_request.withdraw by requester | withdrawal statement queued |
| pending -> expired | closesAt of the verified projection passed on the requester clock, or the listing tombstone was applied by F11.S01.M02 | no statement |
| selected -> withdrawn | bazaar.giveaway_request.withdraw by requester | withdrawal statement queued; the giver releases the hold on receipt |
| selected -> expired | selectedUntil passed on the requester clock | shows expired |
| selected -> collected | bazaar.giveaway_request.confirm_collected by the requester (mark received) | local record only; not proof of delivery |

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> selected: bazaar.giveaway_selection.receive verifies a selection signed by the listing author for this requestId and requestCid (V12)
  pending --> declined: bazaar.giveaway_selection.receive verifies a decline signed by the listing author for this request
  pending --> withdrawn: bazaar.giveaway_request.withdraw by requester
  pending --> expired: closesAt of the verified projection passed on the requester clock, or the listing tombstone was applied by F11.S01.M02
  selected --> withdrawn: bazaar.giveaway_request.withdraw by requester
  selected --> expired: selectedUntil passed on the requester clock
  selected --> collected: bazaar.giveaway_request.confirm_collected by the requester (mark received)
  collected --> [*]
  declined --> [*]
  withdrawn --> [*]
  expired --> [*]
```

### Timeouts and scheduled transitions

- Selected requests expire 72 h after selection.
- Pending requests expire when the giveaway closes (closesAt or listing leaves published).
- Selection statement expiry equals selectedUntil; the requester's app shows expired after that time by its own clock.
- A first-come pick proposal waits for the giver's confirmation without a timeout; while it waits, no unit is held.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T04 | property | PS-005-03.R01, PS-005-03.R02, PS-005-03.R03 | random commands, withdrawals and clock advances | only declared transitions; selected implies active hold; terminal states never regress |
| TEST-PS-005-09.T05 | integration | PS-005-03.R02, PS-005-06.R02 | two tabs select different requests for last unit | one selected, other BAZAAR_GIVEAWAY_NOT_SELECTABLE |
| TEST-PS-005-09.T06 | integration | PS-005-03.R03 | selected recipient does not collect for 72 h | request expired, hold released, second selection possible |
| TEST-PS-005-09.T17 | abuse | PS-005-04.R04, PS-005-03.R04 | R1 receives a selection signed by K, then a valid selection of its older withdrawn request replayed against its new request, then a valid selection | first two quarantined (signer_not_listing_author, binding_mismatch) and the request stays pending; the valid one moves it to selected with selectedUntil; expiry by R1's clock afterwards |
| TEST-PS-005-09.T18 | abuse | PS-005-03.R05 | 200 fresh keys send requests within 60 s to L | at most 25 queued (50 % of queueLimit), all in one tie group ordered by the recorded draw, no selection until the giver confirms the proposed pick; queue label states relays can influence order |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F08.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
