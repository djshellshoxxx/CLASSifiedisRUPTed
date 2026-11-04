# PS-033-05 — Authorization and capabilities: Bidding

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S01.M02 Bidding](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_lifecycle/bids` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-033-05.R01** Vault policy - only the unlocked local principal can sign bids and retractions for its own key; no one can bid on behalf of another key.
- **PS-033-05.R02** Relay policy - the host accepts a bid only when the bid signature verifies against the bidder key inside it, the host acceptance names this host, and hosting policy and quotas allow it; no relay access token substitutes for the bidder signature.
- **PS-033-05.R03** Public ledger reads expose aliases only; the seller learns the bidder key of the winner only through the host-signed result.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.bid.submit | principal | local principal is not the seller; host accepted for this auction by explicit user action; online |
| auctions.bid.place | host-operator, system | bid signature verifies; host acceptance matches; relay quotas satisfied |
| auctions.bid.retract | principal | bid.bidderId = local principal; retraction rules satisfied |
| auctions.bid.read_public | anonymous, principal | ledger projection with aliases only |
| auctions.bid.read_own | principal | bid.bidderId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-033-09.T10 | abuse | PS-033-05.R01, PS-033-05.R02, PS-033-05.R03 | bid signed by another key; bid without host acceptance; public query | VALIDATION_FAILED or AUCTIONS_HOST_NOT_ACCEPTED; public data contains aliases only |

## Dependencies

Module depends on: F04.S01.M01, F04.S02.M01, F04.S02.M02, F07.S01.M01, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
