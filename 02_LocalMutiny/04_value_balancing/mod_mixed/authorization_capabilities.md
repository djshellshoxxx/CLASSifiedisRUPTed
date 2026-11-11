# PS-026-05 — Authorization and capabilities: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-05.R01** Vault policy lets only the unlocked local principal propose or withdraw legs it is allowed to author, and only the payer can claim; the payee acknowledges through F09.S01.M01.
- **PS-026-05.R02** Claims and acknowledgements from other parties arrive as signed statements verified by F09.S01.M01 and are accepted only from the named payer or payee.
- **PS-026-05.R03** Relays and moderators have no capability over legs or payments.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.compensation.propose | principal | principal may author the next revision of the subject (coordinator for cycles, non-author party for proposals) |
| mutiny.compensation.withdraw | principal | leg proposed by this vault and not sealed |
| mutiny.compensation.claim | principal | principal is the payer; leg due |
| mutiny.compensation.activate | system | internal port; caller is F02.S03.M04 in the same vault transaction, after payer and payee accepted the recovery option |
| mutiny.compensation.read | principal | subject stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T09 | abuse | PS-026-05.R01, PS-026-05.R02, PS-026-05.R03 | payee tries to claim; non-participant acknowledges; forged claim | rejected; relay cannot alter any state |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
