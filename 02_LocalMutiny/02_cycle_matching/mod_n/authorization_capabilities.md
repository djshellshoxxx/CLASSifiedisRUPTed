# PS-018-05 — Authorization and capabilities: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-05.R01** Vault commands run only for the unlocked local principal; no other actor can generate, import or dismiss suggestions in that vault.
- **PS-018-05.R02** A relay run requires relay policy permission; the relay computes only from public projections it indexes and holds no private records, so a suggestion can leak nothing beyond public data.
- **PS-018-05.R03** Suggestions are visible only to the principal; participants of a cycle see each other's pseudonyms and public item data only after they receive a proposal, never by the engine.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.suggestion.generate | principal | vault unlocked; matching opted in (F02.S02.M04); rate 6 runs/hour |
| mutiny.suggestion.import | principal | vault unlocked; envelope relay signature verifies against a relay the principal selected |
| mutiny.suggestion.dismiss | principal | suggestion exists in this vault |
| mutiny.suggestion.compute_public | relay-operator | relay policy enables public matching for the tenant; invoked by the relay scheduler or operator-signed request |
| mutiny.suggestion.read | principal | own vault only |
| mutiny.graph.read_stats | principal, relay-operator | principal reads own run statistics; relay operator reads statistics without edges |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T12 | abuse | PS-018-05.R01, PS-018-05.R02, PS-018-05.R03 | other principal calls commands, relay operator reads suggestions | FORBIDDEN or NOT_FOUND; relay stats contain no edges |
| TEST-PS-018-09.T19 | e2e | PS-018-01.R03, PS-018-05.R03 | mobile user opens suggestion, dismisses it | ring diagram text alternative present, axe zero serious issues, no network call made |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F11.S01.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
