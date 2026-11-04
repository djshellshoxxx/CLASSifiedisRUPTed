# PS-004-05 — Authorization and capabilities: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-05.R01** Vault policy: only the listing's author principal may publish, confirm, unpublish, renew or attach a promotion.
- **PS-004-05.R02** The signing key is an authorized device key of the principal (CTR-CAP-001 CAP-8); statements signed by any other key are never produced by this module.
- **PS-004-05.R03** Relay policy rows: each relay decides on its own index and promotion; a relay accepts index writes for requests signed by a registered device key, and a relay moderator or operator may remove from that relay only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.publication.publish | owner | listing.ownerId = local principal; vault unlocked; signing key unrevoked |
| bazaar.publication.confirm | owner | publication.ownerId = local principal and status held_for_confirmation |
| bazaar.publication.unpublish | owner | publication.ownerId = local principal and status active |
| bazaar.publication.end | system | caller is F01.S01.M04 or the policy-change consumer in this module |
| bazaar.publication.renew | owner | publication.ownerId = local principal; renewal window met |
| bazaar.publication.promote | owner | publication.ownerId = local principal; claim payer is the local principal |
| bazaar.publication.read | owner | publication.ownerId = local principal |
| bazaar.publication.relay_index_write | relay-member | relay policy: request signed by a registered device key, within the relay's published quota (default 100 projections per key) |
| bazaar.publication.relay_remove | relay-moderator | relay policy: removal from that relay's index only, with a signed statement of reasons delivered to the author |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T08 | abuse | PS-004-05.R01, PS-004-05.R02 | another principal's key or revoked key signs publish | FORBIDDEN; no statement produced |
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03 | relay moderator removal for R2 and a foreign-author statement at a receiving vault | delivery relay_removed only for R2; foreign statement quarantined; wording says pseudonymous not anonymous |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
