# PS-053-10 — Import, export, backup and rollback: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-10.R01** The vault export contains kit metadata and the encrypted blob so a user can re-download the file, but never the words.
- **PS-053-10.R02** Import validates KDF parameters, blob checksum and the verifier, and sets the kit to active only if verification of the checksum passes.
- **PS-053-10.R03** Parameter changes (a stronger scrypt) are new kit versions; v1 kits remain valid and readable for 180 days after a new major.

## Specification

- **export:** Section identity.recovery_kit in classrup-export/v1 (schema classrup.identity.recovery_kit/v1) with metadata and encrypted blob; the words are never included.
- **import:** A kit with unsupported parameters or checksum mismatch is imported as superseded and reported; at most one imported kit becomes active.
- **backup:** The vault export is the primary backup (IOX-6); the user-selected encrypted backup location receives only the kit file; relays never receive kits.
- **migration rollback:** A stronger KDF is a new kit schema major with a registered migration that requires the user to create a new kit; rollback keeps v1 kits recoverable with the original parameters.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T15 | integration | PS-053-10.R01, PS-053-10.R02, PS-053-10.R03 | export, import to a fresh vault, vault erase | kit metadata and blob round-trip; words never in export; erase leaves the printed kit valid |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
