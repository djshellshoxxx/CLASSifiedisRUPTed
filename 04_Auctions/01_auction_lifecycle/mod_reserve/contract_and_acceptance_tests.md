# PS-035-09 — Contract and acceptance tests: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-035-09.R02** Contract tests validate terms, host acceptance, events and the public projection against the schema registry, including that the reserve never appears.
- **PS-035-09.R03** Two-party integration tests run a seller vault and an in-memory host relay with an injectable clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Seller vault S, host relay H with injectable clock, bidder vault B, auction listing L (EUR), default increment table default-v1; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T01 | unit | PS-035-01.R01, PS-035-01.R03, PS-035-02.R01 | create auctions in EUR, JPY (exponent 0) and BHD (exponent 3) | increments are ceiling-converted to at least 1 minor unit; tiers strictly increasing |
| TEST-PS-035-09.T02 | unit | PS-035-02.R01, PS-035-02.R02, PS-035-02.R03 | each rule V01–V13 violated in turn on vault and on host | documented code returned and nothing stored; reserve never echoed |
| TEST-PS-035-09.T03 | property | PS-035-03.R01 | random command, statement and timer sequences | only declared transitions succeed; closed and cancelled never change |
| TEST-PS-035-09.T04 | integration | PS-035-03.R02, PS-035-02.R02, PS-035-03.R04 | schedule with no host, with host refusing, and with host silent past acceptBy | AUCTIONS_HOST_REQUIRED; cancelled host_refused after a verified host_cancel; cancel_pending with auction_cancel sent; never scheduled |
| TEST-PS-035-09.T05 | integration | PS-035-03.R03, PS-035-06.R02 | advance host clock past startsAt; run open twice; call adjust_end and mark_closed with a stale fence token | opened once with one signed auction_opened; both stale calls refused with PRECONDITION_FAILED |
| TEST-PS-035-09.T06 | contract | PS-035-04.R01, PS-035-04.R02, PS-035-09.R02, PS-035-01.R04 | each command, statement, event and public projection | payloads and signatures validate; terms carry listingCid, acceptBy and softCloseRulesVersion softclose-v1 and host_acceptance echoes the version; the reserve travels only in the envelope encrypted to hostKeyId; projection and events contain no reserve value |
| TEST-PS-035-09.T07 | integration | PS-035-04.R03 | listing unpublished with and without bids | scheduled or zero-bid auction cancelled through a verified host_cancel; auction with bids stays open |
| TEST-PS-035-09.T08 | abuse | PS-035-05.R01, PS-035-05.R02, PS-035-05.R03 | non-seller cancels; terms signed by wrong key; non-moderator cancels on host | FORBIDDEN or rejected; no state change |
| TEST-PS-035-09.T09 | integration | PS-035-06.R01, PS-035-06.R03 | replay schedule; crash after signing terms before recording | same termsCid and acceptance; host dedupes |
| TEST-PS-035-09.T10 | integration | PS-035-07.R01, PS-035-07.R02, PS-035-01.R02 | inspect host log, public projection, events, errors, bidder view and the F10.S02.M02 classification map | reserve absent everywhere except seller view and host; reservePrice and reserveSalt annotated P3 in the vault and P2 with the host as only participant; the reserve envelope is encrypted to hostKeyId |
| TEST-PS-035-09.T11 | abuse | PS-035-02.R02 | seller schedules a 21st live auction on one host | host refuses with AUCTIONS_SELLER_LIMIT |
| TEST-PS-035-09.T12 | load | PS-035-08.R02, PS-035-08.R03 | 1 000 due auctions and 20 accept_hosting req/s for 5 minutes | opens within 10 s, p95 ≤ 300 ms, metrics exported |
| TEST-PS-035-09.T13 | unit | PS-035-09.R01 | traceability tool run | every PS-035 requirement maps to a passing test |
| TEST-PS-035-09.T14 | integration | PS-035-10.R01, PS-035-10.R02, PS-035-10.R03 | export, import into fresh vault with a proposed, a scheduled and an open auction, restore host from backup | auctions round-trip; scheduled and open import as needs_host_check and the sweep never cancels them; reserve stays out of other exports; host restore keeps scheduled auctions |
| TEST-PS-035-09.T15 | e2e | PS-035-01.R02, PS-035-03.R02, PS-035-09.R03 | mobile seller schedules with a host, bidder views host panel and auction page | host named, reserve status shown, no host means feature disabled; axe zero serious issues |
| TEST-PS-035-09.T16 | e2e | PS-035-07.R03 | seller opens the host picker and schedule screen; bidder opens the bid sheet for the first time | trust panel states that the host sees the reserve and bids in plaintext and decides order and time, shown before schedule and before the first bid |
| TEST-PS-035-09.T17 | e2e | PS-035-08.R01 | network capture of the PWA through create, schedule, cancel and auction page views | requests go only to the chosen host relay for statements and projections; zero telemetry or analytics requests |
| TEST-PS-035-09.T18 | integration | PS-035-06.R04, PS-035-03.R04, PS-035-02.R04 | host accepts but the acceptance is lost; 24 h pass; host opened and a bidder bid; second run without bids; host tries to accept after acceptBy | vault sends auction_cancel at acceptBy and waits in cancel_pending; with a bid the host refuses AUCTIONS_HAS_BIDS and the vault shows open; without bids host_cancel and cancelled; late acceptance refused with EXPIRED |
| TEST-PS-035-09.T19 | integration | PS-035-03.R04 | host stops answering after scheduling | after scheduledEndsAt plus 60 minutes plus 72 h the auction is host_silent and the listing lock is released; a later valid result moves it to closed |
| TEST-PS-035-09.T20 | integration | PS-035-04.R05 | F01.S01.M02 asks edit_lock for a listing whose auction has 0 and then 1 bid; material and non-material edits | unlocked at 0 bids; locked at 1 bid so F01 refuses the material edit; the non-material edit is recorded in listingCidHistory and shown on the page |
| TEST-PS-035-09.T21 | contract | PS-035-04.R04, PS-035-05.R04 | F11.S01.M01 registry entries for the five statements; host statement signed by another key | roleFor returns seller key or host key as declared; wrong key quarantined with AUCTIONS_HOST_STATEMENT_INVALID |
| TEST-PS-035-09.T22 | integration | PS-035-07.R04 | export, account deletion, consents withdrawn | section auctions.auctions present; evidence pseudonymized; schedule refused with PRECONDITION_FAILED without federation_publish consent; pushOptIn false without notify_push consent |
| TEST-PS-035-09.T23 | integration | PS-035-04.R06 | host opens and later cancels an auction by host policy | notify.notification.dispatch called once per opted-in recipient with a template key and reference only |
| TEST-PS-035-09.T24 | unit | PS-035-01.R04, PS-035-02.R04 | create a draft without listing, create the listing with its subtypeRef, publish, schedule; schedule with an unpublished listing | draft id accepted as subtypeRef; schedule pins listingCid; unpublished listing refused AUCTIONS_LISTING_NOT_ELIGIBLE at schedule but not at create |
| TEST-PS-035-09.T25 | integration | PS-035-03.R05, PS-035-06.R05, PS-035-04.R08 | restore host H from a backup whose lost window covers bids on open auction A and the end of auction C; the AuctionHostPort implementations run before the port opens; seller vault S receives the restore announcement; S cancels A; nobody returns the result of C for 72 h | A and C frozen once on the host and in vaults with auctions.auction.frozen; bids and close refused; the cancel of A gives host_cancel host_restore although A has bids; C cancelled host_restore at 72 h; no new result determined for either; push dispatched once per opted-in recipient |
| TEST-PS-035-09.T26 | integration | PS-035-04.R07, PS-035-04.R05, PS-035-05.R04 | seller vault receives host_acceptance, a seller copy of a bid receipt, a host_cancel, and a restore announcement signed by a key outside the host key history | auctions.auction.scheduled and auctions.auction.cancelled carry listingId with actor.kind federated; bidCount folded from auctions.bid.placed and edit_lock locked; the forged announcement quarantined with AUCTIONS_HOST_STATEMENT_INVALID and nothing frozen |

## Acceptance criteria

- All tests T01–T26 pass in CI.
- An auction cannot be scheduled or opened without a verified host countersignature and the UI always names the host.
- The reserve value never appears in any payload visible to bidders, in logs, or in errors.
- No vault cancels a proposed auction without telling the host, and every live auction ends in closed, cancelled or host_silent.
- No auction that a host restore may have affected takes another bid or is closed with a newly determined result.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
