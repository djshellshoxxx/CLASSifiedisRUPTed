# PS-142-09 — Contract and acceptance tests: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-142-09.R02** Planted breaking changes (field removed, type changed, required field added) must be caught by the schema diff.
- **PS-142-09.R03** The support matrix in documentation is compared with the matrix actually run in CI to prevent drift.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture sets for N-1 (previous tag) with 842 records, 311 signed statements, one export bundle and 40 recorded API calls; one N-1 to N pair without and one with an IndexedDB version bump; statements with a payload unknown key, ext of 4 KiB, ext of 4 KiB + 1 byte and an unknown ext.crit key; automated cells Chrome N and N-1 (Chrome for Testing), Chrome beta (Playwright channel), Playwright Firefox and WebKit builds; a manual checklist template for Firefox stable N and N-1, Safari last 2, iOS Safari last 2 and iOS 16.4+ installed-PWA push.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T01 | integration | PS-142-01.R01, PS-142-01.R02, PS-142-01.R03 | load fixture manifests and inspect keys | manifest lists version, vault, bundle, statements, API recordings; keys flagged test-only |
| TEST-PS-142-09.T02 | integration | PS-142-02.R01, PS-142-06.R02 | upgrade the N-1 vault and validate all records and signatures; then open the N vault with N-1 code for the pair without an IndexedDB version bump and for the pair with a bump | all records valid and signatures verify; without a bump N-1 opens and reads N data; with a bump N-1 gets VersionError, catches it and offers restore from the pre-upgrade export, with zero record loss and no partial open |
| TEST-PS-142-09.T03 | unit | PS-142-02.R02, PS-142-09.R02 | planted breaking changes: field removed, type changed, required field added | each fails with QUALITY_COMPAT_BREAKING_CHANGE |
| TEST-PS-142-09.T04 | unit | PS-142-02.R03, PS-142-10.R02 | statements with a payload unknown key outside ext, an unknown ext key of 4 KiB, ext of 4 KiB + 1 byte, an unknown key listed in ext.crit, and an unknown major version; an N export into N-1 | payload unknown key gives VALIDATION_FAILED; the 4 KiB ext is accepted, preserved byte-exact and cid and signature re-verify; oversize ext rejected; unknown critical ext refused; major refused with UNSUPPORTED_SCHEMA_VERSION; N export refused clearly by N-1; a reader that drops the unknown key fails with QUALITY_COMPAT_EXT_UNSAFE |
| TEST-PS-142-09.T05 | chaos | PS-142-03.R01, PS-142-06.R01 | interrupt vault upgrade at each step, then restart | resumes or rolls back; zero lost and zero duplicated records; second upgrade identical |
| TEST-PS-142-09.T06 | e2e | PS-142-03.R02, PS-142-03.R03 | automated matrix smoke on Chrome N and N-1 (Chrome for Testing), Chrome beta (Playwright channel), Playwright Firefox build and Playwright WebKit build, then merge the manual checklist | each cell labelled with its engine source and real version and no automated cell labelled Safari; unsupported cells match the policy; a failing automated cell blocks with exit 2; a missing or failed manual cell blocks the release |
| TEST-PS-142-09.T07 | unit | PS-142-04.R01, PS-142-04.R02, PS-142-04.R03 | run scripts; diff OpenAPI of previous tag and working tree with a removed field | documented exit codes; QUALITY_COMPAT_API_BREAKING for removed field |
| TEST-PS-142-09.T08 | integration | PS-142-05.R01, PS-142-05.R02, PS-142-05.R03 | replay N-1 API recordings against in-process relay; statements with unchanged role mapping | accepted using fixture tokens; no secrets outside the process |
| TEST-PS-142-09.T09 | unit | PS-142-06.R03 | force an infrastructure failure on one cell | retried once; assertion failure not retried |
| TEST-PS-142-09.T10 | abuse | PS-142-07.R01, PS-142-07.R02 | scan fixtures and reports for real data and profile config | synthetic only; clean profiles without extensions |
| TEST-PS-142-09.T11 | integration | PS-142-07.R03, PS-142-10.R01 | modify a released fixture directory in a branch | rejected as append-only; reports retained 30 days |
| TEST-PS-142-09.T12 | load | PS-142-08.R01, PS-142-08.R02 | run N-1 data, diff and matrix suites | 60 s, 20 s and 25 min budgets met; versions recorded |
| TEST-PS-142-09.T13 | e2e | PS-142-08.R03 | WebKit engine build - Web Push feature detection and the content-free push payload | payload holds reference and template key only; the fallback message is shown when push is unsupported; the real iOS 16.4+ installed-PWA push cell stays pending until its manual checklist is signed |
| TEST-PS-142-09.T14 | integration | PS-142-09.R01, PS-142-09.R03 | traceability run and doc matrix comparison | every requirement maps to a passing test; documented matrix equals CI matrix |
| TEST-PS-142-09.T15 | integration | PS-142-10.R03 | revert module in a branch | other suites unaffected; release gate fails closed without compat report |
| TEST-PS-142-09.T16 | manual | PS-142-03.R03 | release checklist - smoke journeys on Firefox stable N and N-1, Safari desktop last 2 (macOS), iOS Safari last 2, and push delivery to an iOS 16.4+ installed PWA | each cell signed in gates/manual/<version>/ with device, OS, browser version, result and approver; compat:checklist merges them into reports/compat.json |
| TEST-PS-142-09.T17 | unit | PS-142-03.R02 | matrix report fixtures - a WebKit run labelled safari, a Playwright Firefox run labelled firefox stable, a cell without engine version | each fails with QUALITY_COMPAT_MATRIX_MISLABELED |

## Acceptance criteria

- The current release reads all N-1 vaults, bundles and signed statements with zero loss and all signatures verifying.
- A planted breaking schema or API change fails the compatibility checks.
- Every automated matrix cell (Chrome N, N-1 and beta, Playwright Firefox and WebKit builds) passes smoke with its real engine labelled, and the manual Firefox stable, Safari, iOS Safari and iOS 16.4+ installed-PWA push cells have signed passing checklists; no automated run reports Safari.
- An unknown statement payload key outside ext is rejected, and ext additions are preserved byte-exact and re-verify.
- An interrupted vault upgrade loses and duplicates no record.

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
