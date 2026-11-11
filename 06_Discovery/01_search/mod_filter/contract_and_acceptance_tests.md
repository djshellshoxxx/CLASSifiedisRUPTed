# PS-044-09 — Contract and acceptance tests: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-09.R01** Every requirement is covered by at least one automated test, including property tests on canonicalization.
- **PS-044-09.R02** A golden test fixes the SQL fragment text and parameter order for each filter key.
- **PS-044-09.R03** Injection and limit tests run against a real SQLite database.

## Specification

See the module test table below (all processes).

**Fixtures:** Seed index of 1 000 SearchDocuments across 3 currencies, 6 kinds, 20 categories and 6 conditions, 10 percent with 4-character (L1) cells; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T01 | unit | PS-044-01.R01, PS-044-02.R01 | validate a filter with every key valid | Result ok and canonical form equals golden |
| TEST-PS-044-09.T02 | unit | PS-044-02.R02, PS-044-02.R03 | price without currency, min above max, distance without center, distance 3 km, distance 7 km and 200 km, 6-character center | DISCOVERY_FILTER_CURRENCY_REQUIRED, DISCOVERY_FILTER_INVALID, DISCOVERY_FILTER_CENTER_REQUIRED, DISCOVERY_RADIUS_TOO_SMALL, DISCOVERY_RADIUS_NOT_ALLOWED, DISCOVERY_PRECISION_FORBIDDEN, each with the field path |
| TEST-PS-044-09.T03 | property | PS-044-01.R03 | random key order and equivalent values | canonicalize returns identical bytes and cache keys |
| TEST-PS-044-09.T04 | unit | PS-044-01.R02, PS-044-03.R01, PS-044-01.R04 | compile each key alone and all together, including distanceKm 5, 10, 25, 50 and 100 around u4pru and condition poor | SQL text and params equal golden fixtures; 25 km has the L1 prefix branch, 50 and 100 km use d.geo_cell4 IN (...) |
| TEST-PS-044-09.T05 | property | PS-044-03.R02, PS-044-03.R03 | 200 runs of the same filter with the same clock | identical SQL and params; compile never reads the system clock |
| TEST-PS-044-09.T06 | integration | PS-044-01.R02, PS-044-07.R01, PS-044-01.R04 | compiled filters, including distanceKm 50 and 100 km and L1 documents, run against SQLite with 1 000 documents | returned set equals a brute-force JavaScript filter of the same data and is non-empty for 50 and 100 km |
| TEST-PS-044-09.T07 | abuse | PS-044-07.R02, PS-044-07.R03, PS-044-08.R01 | 10 000 fuzz strings with SQL metacharacters and 5 000-item lists | no SQL injection, errors for oversize lists, validation under 1 ms p95 |
| TEST-PS-044-09.T08 | unit | PS-044-04.R01, PS-044-04.R02, PS-044-04.R03 | inspect module exports and error mapping | no commands, queries or events exist and errors map to documented codes |
| TEST-PS-044-09.T09 | unit | PS-044-05.R01, PS-044-05.R02, PS-044-05.R03 | attempt to filter on a private column name | rejected as unknown key; no capability is defined |
| TEST-PS-044-09.T10 | integration | PS-044-06.R01, PS-044-06.R02, PS-044-06.R03 | taxonomy port unavailable and stale snapshot | DEPENDENCY_UNAVAILABLE without partial output; stale snapshot validates with a hint |
| TEST-PS-044-09.T11 | integration | PS-044-08.R02, PS-044-08.R03 | explain query plan for distance filters of 10 and 100 km and category filters | discovery_doc_cell and discovery_doc_cell4 used, metrics counted by code without values |
| TEST-PS-044-09.T12 | unit | PS-044-09.R01, PS-044-09.R02, PS-044-09.R03 | traceability run over PS-044 | every requirement maps to a passing test; golden files unchanged |
| TEST-PS-044-09.T13 | unit | PS-044-10.R01, PS-044-10.R02, PS-044-10.R03 | load a v1 filter stored inside a saved search export | parsed unchanged; unknown key rejected on import |

## Acceptance criteria

- All tests T01-T13 pass in CI.
- Compiled queries return exactly the brute-force result on the 1 000 document fixture.
- No filter value can alter SQL structure (fuzz suite green).

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
