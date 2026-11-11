# PS-008-05 — Authorization and capabilities: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-05.R01** Vault policy: hold, release, renew and convert are internal ports callable only by the named modules (offers, negotiation, giveaway, cycle lock, deal completion) on behalf of the local principal; the UI uses adjust and release with owner override.
- **PS-008-05.R02** A peer reservation statement is accepted only if signed by an authorized key of the listing owner for that listing; otherwise it is quarantined with a reason (CAP-8).
- **PS-008-05.R03** No relay policy row exists because this module never calls a relay; relays carry encrypted reservation envelopes without reading them.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.inventory.hold | system | caller is F01.S04.M01, F01.S04.M02, F01.S02.M03 or F02.S03.M02 in the vault that owns the item; holderType cycle only from F02.S03.M02 |
| bazaar.inventory.release | system | caller is the holder module, the lease sweep, the Deal consumer, F01.S01.M04 close or archive, or the owner via override |
| bazaar.inventory.renew | system | caller is the holder module or the lease sweep for Deal-linked holds; hold not frozen |
| bazaar.inventory.convert | system | caller is the holder module, F01.S01.M04 close for the closing Deal, or the deal completion consumer |
| bazaar.inventory.adjust | owner | item.ownerId = local principal; also callable by F01.S03.M02 inside its own transaction |
| bazaar.inventory.issue_reservation | owner | hold active and owned locally; audience at most 10 principals |
| bazaar.inventory.record_peer | peer | statement signed by the author key of the verified listing projection; signature, schema and expiry verified |
| bazaar.inventory.read | owner | item.ownerId = local principal or caller module on its behalf |
| bazaar.inventory.read_peer | owner | local principal is in the statement audience or the caller module acts on its behalf |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T09 | abuse | PS-008-05.R01, PS-008-05.R02, PS-008-05.R03 | UI-context dispatch of hold; peer statement signed by non-owner | FORBIDDEN; statement quarantined; relay has no policy row |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
