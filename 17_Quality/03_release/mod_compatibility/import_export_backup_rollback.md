# PS-142-10 — Import, export, backup and rollback: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-10.R01** Compat reports and the support matrix table are exports; fixtures are the N-1 export bundles.
- **PS-142-10.R02** Importing an N export into N-1 must fail clearly (UNSUPPORTED_SCHEMA_VERSION) rather than partially; importing N-1 into N must succeed fully.
- **PS-142-10.R03** Rollback of this module is a git revert; fixtures for a new release are generated at the release tag before changes to schemas are merged.

## Specification

- **export:** reports/compat.json and compat.md; N-1 export bundles act as fixtures.
- **import:** Imports N-1 export bundles (CTR-IOX-001) as fixtures; bundles of an unknown major version are refused with UNSUPPORTED_SCHEMA_VERSION.
- **backup:** Fixtures in git for last 2 releases; reports 30 days in CI.
- **migration rollback:** Fixtures are generated at each release tag before schema changes merge; rollback by git revert; app rollback to N-1 is tested per 06.R02 (no IndexedDB version bump - N-1 reads N data; with a bump - VersionError, then restore from the pre-upgrade export).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T04 | unit | PS-142-02.R03, PS-142-10.R02 | statements with a payload unknown key outside ext, an unknown ext key of 4 KiB, ext of 4 KiB + 1 byte, an unknown key listed in ext.crit, and an unknown major version; an N export into N-1 | payload unknown key gives VALIDATION_FAILED; the 4 KiB ext is accepted, preserved byte-exact and cid and signature re-verify; oversize ext rejected; unknown critical ext refused; major refused with UNSUPPORTED_SCHEMA_VERSION; N export refused clearly by N-1; a reader that drops the unknown key fails with QUALITY_COMPAT_EXT_UNSAFE |
| TEST-PS-142-09.T11 | integration | PS-142-07.R03, PS-142-10.R01 | modify a released fixture directory in a branch | rejected as append-only; reports retained 30 days |
| TEST-PS-142-09.T15 | integration | PS-142-10.R03 | revert module in a branch | other suites unaffected; release gate fails closed without compat report |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
