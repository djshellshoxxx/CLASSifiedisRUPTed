# PS-103-02 — Validation rules: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-02.R01** Routing validates event shape against the producer payload fields named by the routing row and registry membership before a notification is created; malformed input fails with VALIDATION_FAILED.
- **PS-103-02.R02** Everyday non-delivery outcomes - not a recipient, own action, blocked sender, duplicate, expired, filtered and category off - are successful skips returning created false with a skipped reason, counted in diagnostics and never retried or dead-lettered (CTR-EVT-001 EVT-3).
- **PS-103-02.R03** Every violation maps to one stable error code.
- **PS-103-02.R04** Security rows are exempt from the actor exclusion and are skipped only when the event was raised by a command on this device, so changes made by another device of the same principal always alert this device.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | the event type has a routing row and the payload contains every field the row names (recipient, reference, collapse key and filter fields) under the producer's field names | VALIDATION_FAILED |
| V02 | recipient fields are did:key values; when the recipient rule does not select the local principal, or for non-security rows the actor is the local principal, the event is skipped with outcome not_recipient (success, no error) | VALIDATION_FAILED |
| V03 | templateKey and ref.type are in the registries | VALIDATION_FAILED |
| V04 | urgency urgent only for the three fixed security templates | VALIDATION_FAILED |
| V05 | the actor or sender DID is a did:key; when F07.S02.M02 isBlockedEither reports a block the event is dropped silently with outcome blocked (N7) | VALIDATION_FAILED |
| V06 | a source event ID already in the consumer inbox is acknowledged and skipped with outcome duplicate (EVT-3); the same event ID with a different payload hash | IDEMPOTENCY_KEY_REUSED |
| V07 | mark_read expectedRevision matches and the notification belongs to the local principal | CONFLICT_REVISION |
| V08 | an event older than 30 days is skipped with outcome expired; an occurredAt more than 5 minutes in the future | ID_TIMESTAMP_SKEW |
| V09 | row filters are evaluated on producer fields - identity.session.revoked only with reason user_revoked, device_revoked, recovery or passphrase_changed; federation.account.moved only with kind account and subject equal to the local principal; auctions.auction.closed only when outcome is not unsold; bazaar.offer.withdrawn only with reason buyer_withdrew - and non-matching events are skipped with outcome filtered | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T02 | unit | PS-103-02.R01, PS-103-02.R03 | each rule V01 to V09 with malformed input in turn | VALIDATION_FAILED, IDEMPOTENCY_KEY_REUSED or ID_TIMESTAMP_SKEW as documented and nothing stored |
| TEST-PS-103-09.T06 | integration | PS-103-02.R02, PS-103-06.R01, PS-103-06.R04 | deliver each event type twice, shuffled; deliver an own-action event, an expired event and a filtered event | exactly one row per rule; duplicates and other skips return created false with the reason, are acknowledged once and never retried or dead-lettered |
| TEST-PS-103-09.T09 | integration | PS-103-02.R02, PS-103-04.R01 | muted thread message; category with in-app off; security category with an in-app disable attempt | muted flag set and the decision carries muted; no row for the off category but a decision reaches the dispatch port; security row always created |
| TEST-PS-103-09.T15 | integration | PS-103-02.R04 | device B signs a device_link that A receives as a verified statement; the same change raised on A itself; session revoked with reasons idle, rotated and device_revoked; account moved for another principal and for the local principal | urgent security row on A for B's change and none for A's own command; only device_revoked routed; only the local principal's account move routed |
| TEST-PS-103-09.T18 | unit | PS-103-04.R04, PS-103-02.R01 | auctions.auction.unsold followed by auctions.auction.closed with outcome unsold; commerce.deal.completed; notify.email.bounced (origin vault) | exactly one auction row; deal completion row for the other party; email_stopped security row |

## Dependencies

Module depends on: F13.S02.M04, F07.S02.M02, F08.S01.M01, F08.S01.M02, F08.S03.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
