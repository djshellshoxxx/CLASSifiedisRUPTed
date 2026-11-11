# PS-025-05 — Authorization and capabilities: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-05.R01** Vault policy lets only the unlocked local principal compute or verify normalization in its vault.
- **PS-025-05.R02** Records of other parties are accepted only as part of a signed revision whose author is a party of the subject.
- **PS-025-05.R03** Quote sources are external adapters with their own policy; this module never grants a source any right over records.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.normalization.compute | principal | vault unlocked; principal is the coordinator or a party who is allowed to author the next revision |
| mutiny.normalization.verify | principal | revision belongs to a subject in this vault |
| mutiny.normalization.read | principal | record belongs to a subject in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T09 | abuse | PS-025-05.R01, PS-025-05.R02, PS-025-07.R02 | peer revision with altered converted amount by one minor unit | MUTINY_NORMALIZATION_MISMATCH and consent blocked |
| TEST-PS-025-09.T10 | abuse | PS-025-05.R03, PS-025-07.R01, PS-025-07.R03 | manual rate presented as signed; request payload inspected | MUTINY_QUOTE_SOURCE_UNLABELLED; request contains only pair and lifetime |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
