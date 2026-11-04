# PS-035-02 — Validation rules: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-02.R01** Terms are validated strictly in the seller vault before signing and again by the host relay before countersigning.
- **PS-035-02.R02** The host never accepts terms that fail the same rules, whatever the seller vault claims.
- **PS-035-02.R03** Every violation maps to one stable error code with a localized message key; the reserve value is never echoed in an error.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | hostRelayId and hostKeyId are present and the host is in the seller's selected relay list | AUCTIONS_HOST_REQUIRED |
| V02 | currency is registered and startPrice is a positive integer string within limits | VALIDATION_FAILED |
| V03 | reservePrice, when present, is at least startPrice, in the same currency, and its salted hash equals reserveCommitment | AUCTIONS_RESERVE_INVALID |
| V04 | duration is between 1 hour and 14 days and startsAt is within 30 days and not earlier than host now minus 5 minutes | AUCTIONS_SCHEDULE_INVALID |
| V05 | incrementTable satisfies the tier rules in the Auction field definition | AUCTIONS_INCREMENT_INVALID |
| V06 | listing is published, of subtype auction, owned by the seller, and has no live auction | AUCTIONS_LISTING_NOT_ELIGIBLE |
| V07 | seller has fewer than 20 live auctions on this host and the host hosting policy accepts the seller | AUCTIONS_SELLER_LIMIT |
| V08 | cancel is requested only while bidCount is 0 (seller) | AUCTIONS_HAS_BIDS |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T01 | unit | PS-035-01.R01, PS-035-01.R03, PS-035-02.R01 | create auctions in EUR, JPY (exponent 0) and BHD (exponent 3) | increments are ceiling-converted to at least 1 minor unit; tiers strictly increasing |
| TEST-PS-035-09.T02 | unit | PS-035-02.R01, PS-035-02.R02, PS-035-02.R03 | each rule V01–V08 violated in turn on vault and on host | documented code returned and nothing stored; reserve never echoed |
| TEST-PS-035-09.T04 | integration | PS-035-03.R02, PS-035-02.R02 | schedule with no host, with host refusing, and with host silent for 24 h | AUCTIONS_HOST_REQUIRED; cancelled host_refused; cancelled host_unreachable; never scheduled |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
