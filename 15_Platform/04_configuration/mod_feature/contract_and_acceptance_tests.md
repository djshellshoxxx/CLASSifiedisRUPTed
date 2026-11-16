# PS-123-09 — Contract and acceptance tests: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-123-09.R02** Graph validation is tested with property tests over random graphs and with fixtures of every failure code.
- **PS-123-09.R03** The generated file for the real catalog is checked in CI and compared with a fresh generation.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture catalogs: valid 12-module DAG, cycle of 3, unknown dependency, MVP-on-FUTURE dependency, core module off; real planning/modules.yaml with all module specs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T01 | unit | PS-123-01.R01, PS-123-01.R02, PS-123-02.R02 | generate from the valid fixture twice | identical bytes, fields present on every record, hash equals sha256 of canonical JSON |
| TEST-PS-123-09.T02 | unit | PS-123-02.R01, PS-123-02.R03 | each of V01-V07 violated in turn | documented code returned; query for unknown key returns NOT_FOUND |
| TEST-PS-123-09.T03 | property | PS-123-03.R01, PS-123-02.R01 | random digraphs with and without injected back edges | cycle detected exactly when one exists; topological order places dependencies first |
| TEST-PS-123-09.T04 | integration | PS-123-03.R02, PS-123-03.R03, PS-123-06.R02 | break validation in each pipeline step | generation fails, previous file untouched, nothing published |
| TEST-PS-123-09.T05 | contract | PS-123-04.R01, PS-123-04.R02, PS-123-04.R03 | call all four queries in the vault and on a relay | identical results for the same release; no commands or events exist; response within 5 ms |
| TEST-PS-123-09.T06 | abuse | PS-123-05.R01, PS-123-05.R02, PS-123-05.R03 | attempt to mutate the registry through the API and as a hostile client | no mutation path exists; relay ignores client-claimed flags |
| TEST-PS-123-09.T07 | integration | PS-123-01.R03, PS-123-06.R01 | build twice from the same commit, then edit planning/modules.yaml without regenerating | identical bytes; stale check fails with PLATFORM_FEATURE_REGISTRY_STALE |
| TEST-PS-123-09.T08 | integration | PS-123-06.R03, PS-123-02.R03 | vault of release N queries relay of release N+1 hash | mismatch reported informationally, work continues, unknown modules listed |
| TEST-PS-123-09.T09 | abuse | PS-123-07.R01, PS-123-07.R02, PS-123-07.R03 | inspect registry and query payloads | contain no personal data or configuration values; client-claimed dependency satisfaction not trusted by relay |
| TEST-PS-123-09.T10 | load | PS-123-08.R01, PS-123-08.R03 | generate for 148 modules and 5 000 synthetic modules; run 10 000 queries | generation ≤ 2 s for catalog, size within budgets, query p95 ≤ 5 ms |
| TEST-PS-123-09.T11 | integration | PS-123-08.R02 | relay metrics scrape after queries | duration histogram exported per CTR-OBS-001 |
| TEST-PS-123-09.T12 | unit | PS-123-09.R01 | traceability tool run | every PS-123 requirement maps to a passing test |
| TEST-PS-123-09.T13 | integration | PS-123-09.R02, PS-123-09.R03 | generate the real catalog | 18 features, 148 modules, acyclic, defaults satisfy FLG-2, FUTURE modules off and unregistered, core F15 and F16 on |
| TEST-PS-123-09.T14 | a11y | PS-123-04.R03 | Settings > Features scanned with axe | zero serious issues; dependency text is real list text |
| TEST-PS-123-09.T15 | integration | PS-123-10.R01, PS-123-10.R02, PS-123-10.R03 | export, import and release rollback | registry not part of any export; older release regenerates its own registry; no data migration |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- The real catalog generates an acyclic registry with defaults that satisfy the dependency rule.
- Adding a cycle or an unknown dependency to any module spec fails CI with a stable code and a readable path.
- The registry works fully offline and cannot be modified at runtime.

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
