# PS-022-10 — Import, export, backup and rollback: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-10.R01** Export contains the user's dropout records and the signed statements they depend on, with privateReason included only in the user's own export.
- **PS-022-10.R02** Import verifies statements, keeps phase and outcome as recorded, and never reopens or alters the status of a cycle because of an imported dropout.
- **PS-022-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.dropouts in classrup-export/v1; one line per DropoutRecord (schema classrup.mutiny.dropout_record/v1) with statementCid references.
- **import:** Records are verified and stored read-only; privateReason is kept only for records with direction own; conflicting IDs rejected.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext copies of notices in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; enums only grow and unknown values read as other.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T17 | integration | PS-022-10.R01, PS-022-10.R02, PS-022-10.R03 | export, import, rollback | dropout records round-trip; imported cycles do not reopen |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M02, F02.S03.M04, F02.S01.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
