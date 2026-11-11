# PS-142-02 — Validation rules: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-02.R01** The current release must read every N-1 fixture and, after upgrade, every record validates against its current schema and every N-1 signature still verifies.
- **PS-142-02.R02** Schemas follow expand and contract: removed required fields or changed meanings of a field fail the schema diff check with QUALITY_COMPAT_BREAKING_CHANGE.
- **PS-142-02.R03** Readers follow CTR-SCH-001 SCH-2 - an unknown key in a statement payload outside ext is rejected with VALIDATION_FAILED; ext keys are preserved byte-exact so cid and signature still verify and ext is at most 4 KiB; an unknown key listed in ext.crit is refused; unknown major versions are refused with UNSUPPORTED_SCHEMA_VERSION.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Current release reads all N-1 fixtures and upgraded records validate against current schemas | QUALITY_COMPAT_N1_READ_FAILED |
| V02 | Schema diff against the previous tag shows no removed or retyped fields within a major version | QUALITY_COMPAT_BREAKING_CHANGE |
| V03 | N-1 signed statements still verify after upgrade | QUALITY_COMPAT_SIGNATURE_BROKEN |
| V04 | Vault upgrade interrupted at any step loses and duplicates zero records | QUALITY_COMPAT_UPGRADE_UNSAFE |
| V05 | Every automated matrix cell passes smoke or is policy-unsupported, and every manual cell has a signed passing release checklist | QUALITY_COMPAT_BROWSER_FAILED |
| V06 | Relay OpenAPI diff has no removed paths, removed fields or retyped fields | QUALITY_COMPAT_API_BREAKING |
| V07 | Statement payload keys outside ext are rejected when unknown, ext is preserved byte-exact with cid and signature re-verifying and is at most 4 KiB, and unknown ext.crit keys are refused | QUALITY_COMPAT_EXT_UNSAFE |
| V08 | A release that bumps the IndexedDB version keeps a pre-upgrade export or snapshot and N-1 catches VersionError and offers restore with zero record loss and no partial open; a release without a bump passes the N-1 read test | QUALITY_COMPAT_ROLLBACK_UNSAFE |
| V09 | Every matrix cell names its engine source (Chrome for Testing, Playwright channel, Playwright build or manual device) and real version, and no automated cell is labelled Safari or Firefox stable | QUALITY_COMPAT_MATRIX_MISLABELED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T02 | integration | PS-142-02.R01, PS-142-06.R02 | upgrade the N-1 vault and validate all records and signatures; then open the N vault with N-1 code for the pair without an IndexedDB version bump and for the pair with a bump | all records valid and signatures verify; without a bump N-1 opens and reads N data; with a bump N-1 gets VersionError, catches it and offers restore from the pre-upgrade export, with zero record loss and no partial open |
| TEST-PS-142-09.T03 | unit | PS-142-02.R02, PS-142-09.R02 | planted breaking changes: field removed, type changed, required field added | each fails with QUALITY_COMPAT_BREAKING_CHANGE |
| TEST-PS-142-09.T04 | unit | PS-142-02.R03, PS-142-10.R02 | statements with a payload unknown key outside ext, an unknown ext key of 4 KiB, ext of 4 KiB + 1 byte, an unknown key listed in ext.crit, and an unknown major version; an N export into N-1 | payload unknown key gives VALIDATION_FAILED; the 4 KiB ext is accepted, preserved byte-exact and cid and signature re-verify; oversize ext rejected; unknown critical ext refused; major refused with UNSUPPORTED_SCHEMA_VERSION; N export refused clearly by N-1; a reader that drops the unknown key fails with QUALITY_COMPAT_EXT_UNSAFE |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
