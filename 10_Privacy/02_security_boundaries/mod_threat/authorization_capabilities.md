# PS-082-05 — Authorization and capabilities: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-05.R01** The catalog is public documentation readable by anyone; there is no runtime authorization.
- **PS-082-05.R02** Changes go through normal code review with at least one privacy reviewer approval recorded in the entry.
- **PS-082-05.R03** The CI check has no secrets and no network access.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T07 | integration | PS-082-05.R01, PS-082-05.R03 | run the check in an offline sandbox with no secrets | works with no network |
| TEST-PS-082-09.T09 | abuse | PS-082-05.R02, PS-082-06.R02 | attempt to merge a catalog change without privacy reviewer approval or with a failing check | CI blocks the merge |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
