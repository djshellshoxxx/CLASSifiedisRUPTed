# PS-078-10 — Import, export, backup and rollback: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-10.R01** This module's own output format is classrup-export/v1; the module contributes a section privacy.exports listing past export jobs' metadata only.
- **PS-078-10.R02** Import of a bundle is performed by the vault restore flow, which verifies the manifest signature and section hashes produced here before committing any record.
- **PS-078-10.R03** The format follows expand/contract; a new major version keeps the previous major readable for 180 days.
- **PS-078-10.R04** Importing a bundle is owned here - preview verifies and reports, commit applies after the deletion ledger check; the sections' own collision and upgrade rules run behind ExportSectionPort.importLines.

## Specification

- **export:** Section privacy.exports in classrup-export/v1: ExportJob metadata of the last 30 days (schema classrup.privacy.export_job/v1), no bundle content. Manifest fields sectionExportedAt and part {setId, index, total, mediaFrom, mediaTo, part1ManifestSha256} are additive in v1.
- **import:** Vault import is owned here (IOX-2) - privacy.import.preview verifies the bundle or set and returns the dry-run report, privacy.import.commit applies it after the ImportGuardPort deletion ledger check, all or nothing, with per-section collision handling by importLines. Past export job metadata imports as read-only history with status expired; bundles are never imported as jobs. A multi-part set is imported by the restore flow only when every part verifies and all share setId and the part-1 manifest hash (IOX-2).
- **backup:** The export bundle is the user's primary backup (IOX-6); the PWA warns when the last export is older than 30 days. Backups of bundles are the user's responsibility.
- **migration rollback:** Section list and manifest fields are additive in v1; older readers ignore unknown sections and fields; a rollback never changes bundles already written.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T16 | e2e | PS-078-10.R01, PS-078-10.R02, PS-078-10.R03 | export, import into a fresh vault via IOX-2 dry-run and commit, roll back one release | all sections round-trip with identical counts; v1 bundle readable by the previous release; axe zero serious issues on export screens |
| TEST-PS-078-09.T26 | integration | PS-078-02.R04, PS-078-04.R07, PS-078-07.R04, PS-078-10.R04 | commit after the ledger check for a deleted did, with and without newIdentityOverride; a multi-part set missing part 3, with a part from another setId, and a complete set; bundle with another user's P2 records | deleted did PRECONDITION_FAILED then imported as a new principal; incomplete or mixed set fails whole; complete set imports; foreign records counted rejectedForeign and never written; commit is all or nothing |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
