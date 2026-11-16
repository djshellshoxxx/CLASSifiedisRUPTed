# PS-026-10 — Import, export, backup and rollback: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-10.R01** Export contains the user's compensation legs with claim references because they are part of the signed terms and payment evidence.
- **PS-026-10.R02** Import keeps amounts and statuses exactly as exported, never marks anything settled by itself, and asks F09 to re-sync claim status for due and claimed legs.
- **PS-026-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.compensation in classrup-export/v1; one line per CompensationLeg (schema classrup.mutiny.compensation_leg/v1) with paymentClaimId and dealId references.
- **import:** Terminal legs import read-only; due and claimed legs import with their status and a re-sync flag so claim status comes only from F09 evidence; conflicting IDs rejected.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext (IOX-7); payment evidence is backed up with F09 sections.
- **migration rollback:** Additive optional fields only in v1; rollback ignores unknown fields; unknown status values read as due and never as settled.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T16 | integration | PS-026-10.R01, PS-026-10.R02, PS-026-10.R03 | export, import, rollback | legs round-trip with claim status; imported due legs flagged for re-confirmation with F09 |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
