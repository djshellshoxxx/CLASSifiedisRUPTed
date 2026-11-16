# PS-037-05 — Authorization and capabilities: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-05.R01** Relay policy - only host moderators (and operators) of the hosting relay can read, assign, dismiss, cancel, propose or confirm; roles are per host (CAP-9) and every allow or deny is audited (CAP-7).
- **PS-037-05.R02** Conflict of interest is enforced - a seller, a bidder, or a key linked to either cannot be assigned.
- **PS-037-05.R03** Vault policy - vaults only ingest void statements signed by the host key named in the auction terms; no vault role can change a review.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.review.open | moderator, operator, system | host role or trigger event on this host |
| auctions.review.decide | moderator | moderator of the hosting relay; no conflict of interest; for propose_void the proposer differs from the confirmer |
| auctions.review.confirm | moderator | moderator of the hosting relay different from the proposer; proposal not older than 72 hours |
| auctions.review.read | moderator, operator | moderator or operator of the hosting relay |
| auctions.review.receive | principal | any envelope; acceptance depends on host signature and key from the auction terms |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T08 | abuse | PS-037-05.R01, PS-037-05.R02, PS-037-05.R03 | seller, bidder and non-moderator call decisions; moderator who is a bidder is assigned | FORBIDDEN or NOT_FOUND; no state change |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M03, F04.S02.M01, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M03, F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
