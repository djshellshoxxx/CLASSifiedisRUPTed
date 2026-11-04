# PS-035-05 — Authorization and capabilities: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-05.R01** Vault policy - only the unlocked local principal who is the seller creates, schedules or cancels the auction; the seller also reads the reserve.
- **PS-035-05.R02** Relay policy - the host accepts terms only when signed by the seller key named in the terms and within its hosting policy; open, adjust_end and mark_closed are host-internal and callable only by the host's own scheduler and sibling modules.
- **PS-035-05.R03** Host moderators may cancel an auction on that host with a stated reason; this affects only that host. Bidders and viewers read the public projection with no capability beyond a signed or anonymous request.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.auction.create | principal | local principal owns the listing; host selected in local relay list |
| auctions.auction.schedule | principal | auction.sellerId = local principal; state draft |
| auctions.auction.cancel | principal, moderator | seller with zero bids, or host moderator under hosting policy with reason |
| auctions.auction.host_accept | host-operator | terms signed by seller key; host hosting policy and quotas satisfied |
| auctions.auction.run | system | host scheduler or sibling module inside a host transaction holding the auction lease |
| auctions.auction.read_public | anonymous, principal | published projection only |
| auctions.auction.read_own | principal | auction.sellerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T08 | abuse | PS-035-05.R01, PS-035-05.R02, PS-035-05.R03 | non-seller cancels; terms signed by wrong key; non-moderator cancels on host | FORBIDDEN or rejected; no state change |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
