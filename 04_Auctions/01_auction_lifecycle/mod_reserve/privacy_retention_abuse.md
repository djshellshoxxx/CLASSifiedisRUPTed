# PS-035-07 — Privacy, retention and abuse: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-07.R01** The reserve is committed by salted hash publicly and known only to the seller and the host; bidders learn only whether it has been met, and the seller can verify the host's commitment at close.
- **PS-035-07.R02** Public projections carry listing reference, start price, increments, times, host identity and reserveMet, but not bidder identities, aliases tied to keys, or max bids.
- **PS-035-07.R03** The host sees the reserve and bids in plaintext and can misbehave; this trust is stated before the seller schedules and before each bidder's first bid.

## Specification

**Data classification**
- Auction: P3 in the seller vault and on the host (reserve); public projection P0.
- Host acceptance and terms statements: P0 signed envelopes.

**Retention**
- Closed or cancelled auctions: RET-EVIDENCE (2 years after last related activity) in the seller vault; the host keeps records for its published retention, default 90 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Host manipulates reserve or start price | terms are signed by the seller and countersigned by the host; the reserve commitment hash is checked against the revealed value by the seller at close |
| T02 | Seller changes listing after bids | bids reference the termsCid; listing edits after the first bid are flagged on the page and recorded as signals to F04.S02.M03 |
| T03 | Seller picks a colluding host | the host is named on the page and each bidder must accept that host at bid time; hosts publish policy; this does not remove the trust requirement and the UI says so |
| T04 | Seller floods a host with auctions | host quota of 20 live auctions per seller and relay hosting policy |
| T05 | Reserve leak through error messages or events | errors never echo the reserve and events carry only the commitment and reserveMet |

**Abuse controls**
- Host hosting policy may refuse sellers; refusal appears as host_refused with the host's stated reason.
- Host emits listing-edit-after-bid signals to its fraud review queue (F04.S02.M03).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T10 | integration | PS-035-07.R01, PS-035-07.R02, PS-035-07.R03 | inspect host log, public projection, events, errors, bidder view | reserve absent everywhere except seller view and host; host trust panel shown before first bid |
| TEST-PS-035-09.T11 | abuse | PS-035-07.R03 | seller schedules a 21st live auction on one host | AUCTIONS_SELLER_LIMIT |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
