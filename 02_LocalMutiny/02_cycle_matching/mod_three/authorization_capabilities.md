# PS-020-05 — Authorization and capabilities: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-05.R01** Only the local principal reads explanations in its vault, and a relay exposes only the public profile numbers.
- **PS-020-05.R02** Explanations show only data the principal already has, with basis labels for peer claims.
- **PS-020-05.R03** There is no write capability in this module, so no statement can originate here.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.cycle3.read_profile | principal, relay-client | public numbers; relay serves them to any client without authentication |
| mutiny.cycle3.read_explanation | principal | suggestion belongs to the principal's vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T08 | abuse | PS-020-05.R01, PS-020-05.R02, PS-020-05.R03, PS-020-07.R01 | other principal queries; explanation inspected for exclusions | NOT_FOUND; no negative information about absent people |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
