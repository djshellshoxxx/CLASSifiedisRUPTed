# PS-024-10 — Import, export, backup and rollback: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-10.R01** Export contains the user's attestations and recovery cases with signatures, since they are the evidence of what each party asserted.
- **PS-024-10.R02** Import verifies every signature and cid, skips identical records and rejects conflicting IDs, and imports open recovery cases as read-only history with an option to start a new case.
- **PS-024-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.execution in classrup-export/v1; one line per HandoverAttestation (schema classrup.mutiny.handover_attestation/v1) and RecoveryCase (schema classrup.mutiny.recovery_case/v1) with provenance; evidence attachments exported with their own section.
- **import:** Signatures and cids are verified; attestations import as read-only evidence; open cases import with status unchanged but cannot receive new options until the user reopens them as a new case citing the old one.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext envelopes in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; enums only grow and unknown kinds read as issue_reported for display and are never used for completion.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T20 | integration | PS-024-10.R01, PS-024-10.R02, PS-024-10.R03 | export, import, rollback | attestations and cases round-trip with signatures verified; imported open cases are frozen read-only |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
