# PS-035-05 — Authorization and capabilities: Auction setup and reserve

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M01 Auction setup and reserve](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/reserve` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-035-05.R01** Vault policy - only the unlocked local principal who is the seller creates, schedules or cancels the auction; the seller also reads the reserve.
- **PS-035-05.R02** Relay policy - the host accepts terms only when signed by the seller key named in the terms, at or before acceptBy and within its hosting policy; open, adjust_end and mark_closed are host-internal and callable only by the host's own scheduler and sibling modules holding a current fence token.
- **PS-035-05.R03** Host moderators may cancel an auction on that host with a stated reason; this affects only that host. Bidders and viewers read the public projection with no capability beyond a signed or anonymous request.
- **PS-035-05.R04** Vaults accept host_acceptance, auction_opened and host_cancel only when signed by the host key named in the seller's own terms and bound to termsCid; anything else is quarantined.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.auction.create | principal | local principal; a supplied listing is owned by the principal; host selected in local relay list |
| auctions.auction.schedule | principal | auction.sellerId = local principal; state draft |
| auctions.auction.cancel | principal | auction.sellerId = local principal; state draft, proposed, scheduled or open |
| auctions.auction.host_cancel | moderator, system | system for a seller-signed auction_cancel with bidCount 0 or a host refusal; host moderator under hosting policy with a stated reason; affects only this host |
| auctions.auction.host_accept | host-operator, system | terms signed by seller key; host time at or before acceptBy; host hosting policy and quotas satisfied |
| auctions.auction.run | system | host scheduler or sibling module inside a host transaction holding the auction lease with a current fence token |
| auctions.auction.receive | principal | any envelope; acceptance depends on the host key in the local terms |
| auctions.auction.read_public | anonymous, principal | published projection only |
| auctions.auction.read_own | principal, system | auction.sellerId = local principal; edit_lock also callable in-process by F01.S01.M02 in the same vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-035-09.T08 | abuse | PS-035-05.R01, PS-035-05.R02, PS-035-05.R03 | non-seller cancels; terms signed by wrong key; non-moderator cancels on host | FORBIDDEN or rejected; no state change |
| TEST-PS-035-09.T21 | contract | PS-035-04.R04, PS-035-05.R04 | F11.S01.M01 registry entries for the five statements; host statement signed by another key | roleFor returns seller key or host key as declared; wrong key quarantined with AUCTIONS_HOST_STATEMENT_INVALID |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F09.S03.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, F12.S03.M04, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
