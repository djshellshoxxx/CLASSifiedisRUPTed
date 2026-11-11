# PS-036-05 — Authorization and capabilities: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-05.R01** Relay policy - check and score are callable only by the host's own bid path and job runner; allow_pair and review queries require the host operator or moderator role on that host.
- **PS-036-05.R02** No vault command exists in this module; bidders and sellers cannot read ShillChecks, including their own.
- **PS-036-05.R03** Roles are per host (CAP-9) and affect only auctions hosted there.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| auctions.shill.check | system | called inside a bid transaction holding the auction lease |
| auctions.shill.score | system | host job runner |
| auctions.shill.allow_pair | operator | host operator signed request; reason recorded; one auction and one pair; bidder key differs from the seller key; covers only linked_host_registration or linked_attestation |
| auctions.shill.read_review | moderator, operator | moderator or operator of the hosting relay |
| auctions.shill.read_public | anonymous, principal | policy text only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T07 | abuse | PS-036-05.R01, PS-036-05.R02, PS-036-05.R03 | bidder, seller and non-moderator try to read checks; allow_pair without operator role | FORBIDDEN or NOT_FOUND; no data returned |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
