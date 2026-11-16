# PS-014-05 — Authorization and capabilities: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-05.R01** Only the unlocked local principal changes the roster in its vault, and only the principal's own party can be marked left by an explicit leave; other parties are marked only from verified signed notices or local rules.
- **PS-014-05.R02** A signed notice that a party left is accepted only if signed by that party's registered device key.
- **PS-014-05.R03** Rosters are readable only by the vault owner.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.party.join | principal | vault unlocked; principal is in the roster or is the coordinator creating it |
| mutiny.party.leave | principal | own party, or verified signed notice from that party, or a local rule decision of the owning module |
| mutiny.party.read | principal | subject stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T07 | abuse | PS-014-05.R01, PS-014-05.R02, PS-014-05.R03 | other principal calls join; leave notice signed by wrong key | FORBIDDEN and notice ignored; roster unreadable by others |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
