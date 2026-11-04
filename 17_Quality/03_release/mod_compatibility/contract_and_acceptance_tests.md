# PS-142-09 — Contract and acceptance tests: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-142-09.R02** Planted breaking changes (field removed, type changed, required field added) must be caught by the schema diff.
- **PS-142-09.R03** The support matrix in documentation is compared with the matrix actually run in CI to prevent drift.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture sets for N-1 (previous tag) with 842 records, 311 signed statements, one export bundle and 40 recorded API calls; browser versions: Chrome and Firefox last 2 stable, Safari last 2, iOS Safari 16.4 minimum.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T01 | integration | PS-142-01.R01, PS-142-01.R02, PS-142-01.R03 | load fixture manifests and inspect keys | manifest lists version, vault, bundle, statements, API recordings; keys flagged test-only |
| TEST-PS-142-09.T02 | integration | PS-142-02.R01, PS-142-06.R02 | upgrade the N-1 vault and validate all records and signatures; open N vault with N-1 code | all records valid and signatures verify; N-1 ignores unknown optional fields |
| TEST-PS-142-09.T03 | unit | PS-142-02.R02, PS-142-09.R02 | planted breaking changes: field removed, type changed, required field added | each fails with QUALITY_COMPAT_BREAKING_CHANGE |
| TEST-PS-142-09.T04 | unit | PS-142-02.R03, PS-142-10.R02 | statement with unknown optional field and with unknown major version | optional ignored; major refused with UNSUPPORTED_SCHEMA_VERSION; N export into N-1 refused clearly |
| TEST-PS-142-09.T05 | chaos | PS-142-03.R01, PS-142-06.R01 | interrupt vault upgrade at each step, then restart | resumes or rolls back; zero lost and zero duplicated records; second upgrade identical |
| TEST-PS-142-09.T06 | e2e | PS-142-03.R02, PS-142-03.R03 | browser matrix smoke on Chrome, Firefox and WebKit | cells report pass; unsupported cells match the policy; a failing cell blocks with exit 2 |
| TEST-PS-142-09.T07 | unit | PS-142-04.R01, PS-142-04.R02, PS-142-04.R03 | run scripts; diff OpenAPI of previous tag and working tree with a removed field | documented exit codes; QUALITY_COMPAT_API_BREAKING for removed field |
| TEST-PS-142-09.T08 | integration | PS-142-05.R01, PS-142-05.R02, PS-142-05.R03 | replay N-1 API recordings against in-process relay; statements with unchanged role mapping | accepted using fixture tokens; no secrets outside the process |
| TEST-PS-142-09.T09 | unit | PS-142-06.R03 | force an infrastructure failure on one cell | retried once; assertion failure not retried |
| TEST-PS-142-09.T10 | abuse | PS-142-07.R01, PS-142-07.R02 | scan fixtures and reports for real data and profile config | synthetic only; clean profiles without extensions |
| TEST-PS-142-09.T11 | integration | PS-142-07.R03, PS-142-10.R01 | modify a released fixture directory in a branch | rejected as append-only; reports retained 30 days |
| TEST-PS-142-09.T12 | load | PS-142-08.R01, PS-142-08.R02 | run N-1 data, diff and matrix suites | 60 s, 20 s and 25 min budgets met; versions recorded |
| TEST-PS-142-09.T13 | e2e | PS-142-08.R03 | iOS Safari 16.4 profile feature detection and content-free push payload | push capability detected; payload holds reference and template key only; fallback message shown otherwise |
| TEST-PS-142-09.T14 | integration | PS-142-09.R01, PS-142-09.R03 | traceability run and doc matrix comparison | every requirement maps to a passing test; documented matrix equals CI matrix |
| TEST-PS-142-09.T15 | integration | PS-142-10.R03 | revert module in a branch | other suites unaffected; release gate fails closed without compat report |

## Acceptance criteria

- The current release reads all N-1 vaults, bundles and signed statements with zero loss and all signatures verifying.
- A planted breaking schema or API change fails the compatibility checks.
- The last 2 versions of Chrome, Firefox and Safari pass smoke journeys and iOS Safari 16.4 or later is covered for Web Push.
- An interrupted vault upgrade loses and duplicates no record.

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
