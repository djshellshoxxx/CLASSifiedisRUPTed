# PS-078-02 — Validation rules: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-02.R01** Requests are validated for recent unlock, limits and size estimate before collection starts.
- **PS-078-02.R02** Each module section is validated against its registered schema list and its own line format before it is accepted.
- **PS-078-02.R03** The manifest is validated and its signature verified before the job becomes ready.
- **PS-078-02.R04** Import verification is a gate before any record is written - format classrup-export/v1, manifest Ed25519 signature against a device key linked to manifest.did, per-section sha256, schema major current or previous, setId and part-1 manifest hash linkage across parts, and the principal match.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | principal unlocked the vault within the last 5 minutes | UNAUTHENTICATED |
| V02 | no job is requested or collecting in this vault; a new command ID while one is active returns params.activeJobId | PRECONDITION_FAILED |
| V03 | at most 3 export requests per 24 hours per vault, counting each part of a set once per set | RATE_LIMITED |
| V04 | estimated size of the bundle or part at most 2 GiB and free storage at least 1.2 times the estimate | PRIVACY_EXPORT_QUOTA |
| V05 | every section line is valid JSON with schema from the module's registered list | PRIVACY_EXPORT_SECTION_FAILED |
| V06 | every line has passed redactForExport (F10.S02.M02), so no line contains another user's P2 or higher content outside the user's own shared copies, nor any P4 or unclassified path | PRIVACY_EXPORT_SECTION_FAILED |
| V07 | manifest sha256 per section matches the streamed bytes and the Ed25519 signature verifies | PRIVACY_EXPORT_SIGNATURE_INVALID |
| V08 | download requested while status ready and not past expiresAt | EXPIRED |
| V09 | part index is between 1 and total, total at most 8, and the media date range does not overlap another part of the same setId | VALIDATION_FAILED |
| V10 | import bundle format is classrup-export/v1, every section line parses, every section sha256 equals the manifest value, and each section schema major is the current or the previous one | VALIDATION_FAILED |
| V11 | import manifest Ed25519 signature verifies against a device key listed in the bundle's identity.device_keys section whose did:key derivation links to manifest.did, and for a multi-part set every part shares setId and the part-1 manifest hash | PRIVACY_IMPORT_SIGNATURE_INVALID |
| V12 | import manifest.did equals the unlocked principal, or the vault holds no records of its own | PRIVACY_IMPORT_PRINCIPAL_MISMATCH |
| V13 | import commit names a preview not older than 30 minutes, and the ImportGuardPort ledger check reports the manifest did as not deleted unless the user chose the new-identity override | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T01 | unit | PS-078-01.R01, PS-078-02.R01 | request an export with fresh and stale unlock | fresh creates job with sections; stale returns UNAUTHENTICATED |
| TEST-PS-078-09.T03 | unit | PS-078-02.R02, PS-078-02.R03 | rules V01 to V09 violated in turn | documented error code returned and no partial file left |
| TEST-PS-078-09.T04 | integration | PS-078-02.R02, PS-078-03.R01, PS-078-04.R02 | 10 module sections, one of which throws after 3 attempts | at most 4 sections run at the same time; job failed naming the module; no partial bundle; PRIVACY_EXPORT_SECTION_FAILED |
| TEST-PS-078-09.T13 | integration | PS-078-07.R02, PS-078-02.R02 | bundle scanned for P4 fields, unclassified fields and other users' private content | none present; user's own shared copies present |
| TEST-PS-078-09.T25 | contract | PS-078-02.R04, PS-078-04.R07, PS-078-09.R04 | preview of a valid bundle, a bundle with one flipped byte, a bundle whose manifest key is not in identity.device_keys, and a bundle of another did into a non-empty vault | first returns the dry-run report with per-section records, identical, conflicts, rejectedForeign and unknownSchema and writes nothing; second and third PRIVACY_IMPORT_SIGNATURE_INVALID; fourth PRIVACY_IMPORT_PRINCIPAL_MISMATCH |
| TEST-PS-078-09.T26 | integration | PS-078-02.R04, PS-078-04.R07, PS-078-07.R04, PS-078-10.R04 | commit after the ledger check for a deleted did, with and without newIdentityOverride; a multi-part set missing part 3, with a part from another setId, and a complete set; bundle with another user's P2 records | deleted did PRECONDITION_FAILED then imported as a new principal; incomplete or mixed set fails whole; complete set imports; foreign records counted rejectedForeign and never written; commit is all or nothing |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
