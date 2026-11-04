# PS-077-10 — Import, export, backup and rollback: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-10.R01** The vault export includes DeletionRequest metadata in the section privacy.deletion and the user is prompted to export before the grace period ends.
- **PS-077-10.R02** A restore or import consults the tombstone and deletion ledger before committing and never resurrects a completed deletion without the user's explicit override that creates a new identity.
- **PS-077-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days; the ledger format is stable for at least 180 days.

## Specification

- **export:** Section privacy.deletion in classrup-export/v1: the active DeletionRequest metadata without salt (schema classrup.privacy.deletion_request/v1). After completion no export is possible because the vault no longer exists.
- **import:** A bundle whose did appears in the deletion ledger is refused with a clear message; override creates a new did and imports content as a new principal.
- **backup:** User-held exports and encrypted backups are outside platform control and are not erased; the UI says so. Relay backups follow CTR-IOX-001 IOX-3 and after a restore the relay replays its deletion ledger before serving.
- **migration rollback:** Additive fields only; rollback is safe because the ledger is append-only and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T16 | integration | PS-077-10.R01, PS-077-10.R02, PS-077-10.R03 | export before deletion, import into fresh vault, roll back one release | export contains the request metadata only; ledger survives rollback |

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
