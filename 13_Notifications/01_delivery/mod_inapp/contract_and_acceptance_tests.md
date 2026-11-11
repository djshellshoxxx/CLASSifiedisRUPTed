# PS-103-09 — Contract and acceptance tests: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-103-09.R02** A routing table test asserts every routed event type exists in the catalog emits, every field each row names exists in the producer payload in the schema registry, and the security and auction filters are present.
- **PS-103-09.R03** Contract tests check commands, queries and event payloads against the schema registry.
- **PS-103-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues and a keyboard and screen-reader walk-through.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U as seller of listing L and buyer elsewhere, devices A and B of U, routing table of 63 routed events, blocked user X, muted thread M, 600 fresh DIDs, F07.S02.M02 block double, NotificationDispatchPort spy, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T01 | unit | PS-103-01.R01, PS-103-01.R02, PS-103-01.R03 | route bazaar.offer.made to seller U | Notification stored with category offers, template notify.tpl.offers.made, ref offer, collapse key listingId, no text fields |
| TEST-PS-103-09.T02 | unit | PS-103-02.R01, PS-103-02.R03 | each rule V01 to V09 with malformed input in turn | VALIDATION_FAILED, IDEMPOTENCY_KEY_REUSED or ID_TIMESTAMP_SKEW as documented and nothing stored |
| TEST-PS-103-09.T03 | property | PS-103-03.R01, PS-103-03.R02, PS-103-03.R03 | random sequences of events within and beyond 10-minute windows, reads and sweeps | count equals collapsed events; read never reopens; new window creates new row |
| TEST-PS-103-09.T04 | contract | PS-103-04.R01, PS-103-04.R02, PS-103-09.R03 | create, mark_read, mark_all_read, list, unread_count execute | outputs and event payloads validate against registry schemas; created carries collapseKey; the dispatch port receives one decision per non-skipped event, also for in-app off |
| TEST-PS-103-09.T05 | contract | PS-103-04.R03, PS-103-04.R04, PS-103-09.R02 | iterate the routing table against modules.yaml and the schema registry | every routed type is in the catalog emits; every recipient, ref, collapse and filter field exists in the producer payload; completion, offer withdrawal and email_stopped rows present; filters present for identity.session.revoked reasons, federation.account.moved kind and subject, auctions.auction.closed outcome, bazaar.offer.withdrawn reason and services.quote.declined reason; urgent only on 3 security templates |
| TEST-PS-103-09.T06 | integration | PS-103-02.R02, PS-103-06.R01, PS-103-06.R04 | deliver each event type twice, shuffled; deliver an own-action event, an expired event and a filtered event | exactly one row per rule; duplicates and other skips return created false with the reason, are acknowledged once and never retried or dead-lettered |
| TEST-PS-103-09.T07 | abuse | PS-103-05.R01, PS-103-05.R02, PS-103-05.R03 | event from blocked X; event with unverified statement; foreign actor tries to create or read rows | no row and no dispatch decision for X; no external access |
| TEST-PS-103-09.T08 | integration | PS-103-06.R02, PS-103-06.R03 | 100 concurrent offer events for one listing; template render failure | one collapsed row count 100; fallback text on render failure |
| TEST-PS-103-09.T09 | integration | PS-103-02.R02, PS-103-04.R01 | muted thread message; category with in-app off; security category with an in-app disable attempt | muted flag set and the decision carries muted; no row for the off category but a decision reaches the dispatch port; security row always created |
| TEST-PS-103-09.T10 | abuse | PS-103-07.R01, PS-103-07.R02, PS-103-07.R03 | 51st event from one actor in a day; 501st row; inspect exported diagnostics and the dispatch port arguments | hidden counter increments, cap removes read rows first, no content in exports, refs and collapse keys reach only the in-vault port |
| TEST-PS-103-09.T11 | load | PS-103-08.R01, PS-103-08.R02, PS-103-08.R03 | 1 000 events catch-up and list of 50 items | budgets met; skip counters by reason present |
| TEST-PS-103-09.T12 | unit | PS-103-09.R01 | traceability tool run | every PS-103 requirement maps to a passing test |
| TEST-PS-103-09.T13 | integration | PS-103-10.R01, PS-103-10.R02, PS-103-10.R03 | export, import into fresh vault, restore from backup | rows round trip; imported rows older than 30 days dropped; unread counts equal; no alert triggered by import |
| TEST-PS-103-09.T14 | a11y | PS-103-09.R04 | inbox with screen reader and keyboard | list semantics, unread state in text, mark all read announced, zero serious axe issues |
| TEST-PS-103-09.T15 | integration | PS-103-02.R04 | device B signs a device_link that A receives as a verified statement; the same change raised on A itself; session revoked with reasons idle, rotated and device_revoked; account moved for another principal and for the local principal | urgent security row on A for B's change and none for A's own command; only device_revoked routed; only the local principal's account move routed |
| TEST-PS-103-09.T16 | abuse | PS-103-07.R03, PS-103-07.R04, PS-103-01.R04 | 600 fresh DIDs each send one offer while U has 30 unread rows from known counterparties and the inbox is near the cap | after 20 rows the rest collapse into one new_members row; every pre-existing unread row from known counterparties survives; unknown-actor rows evicted first |
| TEST-PS-103-09.T17 | integration | PS-103-04.R05 | DeletionPort plan and purge, export section and retention purge with F10 registry doubles; block added for an actor with unread rows | purge removes rows and the known-actor index; section notify.notifications exported; rows purged after 30 days; blocked actor's unread rows hidden |
| TEST-PS-103-09.T18 | unit | PS-103-04.R04, PS-103-04.R07, PS-103-02.R01 | auctions.auction.unsold followed by auctions.auction.closed with outcome unsold; auctions.auction.won and auctions.auction.closed with outcome won in the seller, winner and a non-party vault; commerce.deal.completed; notify.email.bounced (origin vault) | exactly one unsold row for the seller; one sold row for the seller and one won row for the winner, none in the non-party vault and no closed row; deal completion row for the other party; email_stopped security row |
| TEST-PS-103-09.T19 | contract | PS-103-04.R06, PS-103-02.R01 | route every cycle, recovery, proposal, quote, booking, milestone, dispute, rental, auction and meetup event in the vaults of each party and of a non-party, with an own-action copy for each actor field; deliver a host-local auctions.result.voided to the relay instance | each party gets exactly one row resolved from the documented DID fields (participantIds, remainingParticipantIds, proposerId, counterpartyId, clientId, providerId, ownerId, renterId, cancelledBy, sellerId, winnerId, candidateId, parties[], partyDids[]); the actor and the non-party get none; quote.declined with reason superseded or blocked creates none; the host-local void creates no inbox row and its parties are reached only through the dispatch hook |

## Acceptance criteria

- All tests T01 to T19 pass in CI.
- Every routed event exists in the catalog, every routing field exists in its producer payload, and the inbox never stores text content.
- Security notifications are created regardless of the in-app preference and for changes made on the user's other devices.
- Duplicate event delivery never creates a second row and never retries.

## Dependencies

Module depends on: F13.S02.M04, F07.S02.M02, F08.S01.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
