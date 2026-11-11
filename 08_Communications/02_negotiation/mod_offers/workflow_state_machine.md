# PS-063-03 — Workflow state machine: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-03.R01** A card posted locally starts posted and an inbound card starts waiting; cards move to superseded, closed, frozen or unverified; superseded, closed and unverified are terminal for display, and a posted card becomes unverified when its referenced record disappears or a later re-verification fails.
- **PS-063-03.R02** Closing follows only verified terminal events of the owning module and never the card poster's own claim.
- **PS-063-03.R03** A waiting card that gets no matching record within 7 days becomes unverified and is not retried automatically.
- **PS-063-03.R04** Supersession never follows an unverified card - only a newer card that reached posted, or an owning-module revision event, supersedes - and withdrawn proposals close their cards while forked revisions freeze them until the owning module resolves the fork.

## Specification

### ThreadOfferCard (local post) lifecycle

Initial **posted**; terminal **superseded**, **closed**, **unverified**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| posted -> superseded | a newer card for the same refId reached posted in the thread, or an owning-module revision event (bazaar.negotiation.countered, mutiny.proposal.revised) | supersededBy linked |
| posted -> closed | owning-module terminal event (accepted, rejected, withdrawn, expired, declined, cancelled, listing_unavailable, blocked, frozen) | closedReason stored |
| posted -> frozen | mutiny.revision.forked for the referenced proposal | actions removed |
| posted -> unverified | referenced record removed locally or a later re-verification fails | unverifiedReason stored; actions removed |
| frozen -> superseded | owning module resolves the fork with a newer revision | supersededBy linked |
| frozen -> closed | owning module closes the record | closedReason stored |

```mermaid
stateDiagram-v2
  [*] --> posted
  posted --> superseded: a newer card for the same refId reached posted in the thread, or an owning-module revision event (bazaar.negotiation.countered, mutiny.proposal.revised)
  posted --> closed: owning-module terminal event (accepted, rejected, withdrawn, expired, declined, cancelled, listing_unavailable, blocked, frozen)
  posted --> frozen: mutiny.revision.forked for the referenced proposal
  posted --> unverified: referenced record removed locally or a later re-verification fails
  frozen --> superseded: owning module resolves the fork with a newer revision
  frozen --> closed: owning module closes the record
  superseded --> [*]
  closed --> [*]
  unverified --> [*]
```

### ThreadOfferCard (inbound) lifecycle

Initial **waiting**; terminal **superseded**, **closed**, **unverified**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| waiting -> posted | referenced statement arrives and hash, signature, key status and role verify | emits comms.offer_card.posted with origin federated |
| waiting -> unverified | 7 days without matching record or verification failure | unverifiedReason stored |
| posted -> superseded | a newer card for the same refId reached posted, or an owning-module revision event | supersededBy linked |
| posted -> closed | owning-module terminal event | closedReason stored |
| posted -> frozen | mutiny.revision.forked for the referenced proposal | actions removed |
| posted -> unverified | referenced record removed locally or a later re-verification fails | unverifiedReason stored |
| frozen -> superseded | owning module resolves the fork with a newer revision | supersededBy linked |
| frozen -> closed | owning module closes the record | closedReason stored |

```mermaid
stateDiagram-v2
  [*] --> waiting
  waiting --> posted: referenced statement arrives and hash, signature, key status and role verify
  waiting --> unverified: 7 days without matching record or verification failure
  posted --> superseded: a newer card for the same refId reached posted, or an owning-module revision event
  posted --> closed: owning-module terminal event
  posted --> frozen: mutiny.revision.forked for the referenced proposal
  posted --> unverified: referenced record removed locally or a later re-verification fails
  frozen --> superseded: owning module resolves the fork with a newer revision
  frozen --> closed: owning module closes the record
  superseded --> [*]
  closed --> [*]
  unverified --> [*]
```

### Timeouts and scheduled transitions

- Waiting cards are re-verified when new statements arrive and expire to unverified after 7 days.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T03 | property | PS-063-03.R01, PS-063-03.R02 | random sequences of owning-module events and card posts | transitions only as declared; closed, superseded and unverified never change; closed only follows verified terminal events |
| TEST-PS-063-09.T04 | integration | PS-063-03.R03 | card arrives before its referenced offer statement; statement arrives on day 3, another card never arrives for 7 days | first becomes posted, second becomes unverified |
| TEST-PS-063-09.T15 | abuse | PS-063-03.R04 | after a verified card for O revision 1, a card for revision 2 arrives whose referenced statement never verifies | the revision 1 card stays posted; the new card ends unverified and supersedes nothing |
| TEST-PS-063-09.T16 | integration | PS-063-03.R04, PS-063-04.R03 | mutiny.proposal.withdrawn and mutiny.revision.forked for P | P cards close with reason withdrawn, or freeze without actions and later close or are superseded when the owning module resolves |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
