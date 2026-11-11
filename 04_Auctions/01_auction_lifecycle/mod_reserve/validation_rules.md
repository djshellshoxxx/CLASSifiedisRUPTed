# PS-035-02 — Validation rules: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-02.R01** Terms are validated strictly in the seller vault before signing and again by the host relay before countersigning.
- **PS-035-02.R02** The host never accepts terms that fail the same rules, whatever the seller vault claims.
- **PS-035-02.R03** Every violation maps to one stable error code with a localized message key; the reserve value is never echoed in an error.
- **PS-035-02.R04** Schedule and accept_hosting check the listing (published, kind auction, subtypeRef equal to this auction, listingCid current) because create allows a draft without a listing; the published check is never made at create.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | hostRelayId and hostKeyId are present and the host is in the seller's selected relay list | AUCTIONS_HOST_REQUIRED |
| V02 | currency is registered and startPrice is a positive integer string within limits | VALIDATION_FAILED |
| V03 | reservePrice, when present, is at least startPrice, in the same currency, and its salted hash equals reserveCommitment | AUCTIONS_RESERVE_INVALID |
| V04 | duration is between 1 hour and 14 days and startsAt is within 30 days and not earlier than host now minus 5 minutes | AUCTIONS_SCHEDULE_INVALID |
| V05 | incrementTable satisfies the tier rules in the Auction field definition | AUCTIONS_INCREMENT_INVALID |
| V06 | at schedule and accept_hosting only - listing is published, of kind auction with subtypeRef equal to this auction id, owned by the seller, its published projection cid equals listingCid, and no other live auction references it; at create a supplied listingId only has to be owned by the seller | AUCTIONS_LISTING_NOT_ELIGIBLE |
| V07 | seller has fewer than 20 live auctions on this host, the host hosting policy accepts the seller and the F12.S03.M04 limits check passes | AUCTIONS_SELLER_LIMIT |
| V08 | a seller cancel is applied by the host only while bidCount is 0, or while the auction is frozen after a host restore (reason host_restore) | AUCTIONS_HAS_BIDS |
| V09 | softCloseRulesVersion is a version known to vault and host (softclose-v1 in v1) and host_acceptance echoes the same version | VALIDATION_FAILED |
| V10 | accept_hosting runs at host time at or before acceptBy, and acceptBy equals min(terms signing time + 24 h, startsAt + 5 min) | EXPIRED |
| V11 | privacy.consent.check(federation_publish) for the chosen host relay is granted before schedule sends terms whose public projection the host will publish | PRECONDITION_FAILED |
| V12 | inbound host statements (host_acceptance, auction_opened, host_cancel) verify against hostKeyId in the seller's own terms and bind termsCid | AUCTIONS_HOST_STATEMENT_INVALID |
| V13 | a classrup.platform.relay_restore/v1 announcement is applied to an auction only when it is signed under context classrup-relay-restore:v1 by a non-revoked key of hostRelayId in the host relay's published key history (F15.S02.M01) | AUCTIONS_HOST_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T01 | unit | PS-035-01.R01, PS-035-01.R03, PS-035-02.R01 | create auctions in EUR, JPY (exponent 0) and BHD (exponent 3) | increments are ceiling-converted to at least 1 minor unit; tiers strictly increasing |
| TEST-PS-035-09.T02 | unit | PS-035-02.R01, PS-035-02.R02, PS-035-02.R03 | each rule V01–V13 violated in turn on vault and on host | documented code returned and nothing stored; reserve never echoed |
| TEST-PS-035-09.T04 | integration | PS-035-03.R02, PS-035-02.R02, PS-035-03.R04 | schedule with no host, with host refusing, and with host silent past acceptBy | AUCTIONS_HOST_REQUIRED; cancelled host_refused after a verified host_cancel; cancel_pending with auction_cancel sent; never scheduled |
| TEST-PS-035-09.T11 | abuse | PS-035-02.R02 | seller schedules a 21st live auction on one host | host refuses with AUCTIONS_SELLER_LIMIT |
| TEST-PS-035-09.T18 | integration | PS-035-06.R04, PS-035-03.R04, PS-035-02.R04 | host accepts but the acceptance is lost; 24 h pass; host opened and a bidder bid; second run without bids; host tries to accept after acceptBy | vault sends auction_cancel at acceptBy and waits in cancel_pending; with a bid the host refuses AUCTIONS_HAS_BIDS and the vault shows open; without bids host_cancel and cancelled; late acceptance refused with EXPIRED |
| TEST-PS-035-09.T24 | unit | PS-035-01.R04, PS-035-02.R04 | create a draft without listing, create the listing with its subtypeRef, publish, schedule; schedule with an unpublished listing | draft id accepted as subtypeRef; schedule pins listingCid; unpublished listing refused AUCTIONS_LISTING_NOT_ELIGIBLE at schedule but not at create |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
