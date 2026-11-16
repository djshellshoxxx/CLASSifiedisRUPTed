# PS-013-05 — Authorization and capabilities: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-05.R01** Only the unlocked local principal defines or voids legs, and only for subjects stored in its vault.
- **PS-013-05.R02** The principal may define a leg whose giver is another party only to describe a request, never as a reservation or commitment of that party.
- **PS-013-05.R03** Legs of other parties are readable only as part of subjects the principal is a party of.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.leg.define | principal | vault unlocked; principal is a party of the subject and subject is draft or open |
| mutiny.leg.void | principal | leg defined by this vault and status defined |
| mutiny.leg.read | principal | leg belongs to a subject in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T09 | abuse | PS-013-05.R01, PS-013-05.R02, PS-013-05.R03, PS-013-07.R01 | other principal defines or reads; leg for someone else's unlisted item | FORBIDDEN or NOT_FOUND; MUTINY_ITEM_NOT_OWNED |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
