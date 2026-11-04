# PS-044-07 — Privacy, retention and abuse: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-07.R01** Filters touch only public columns and carry no personal data; they are stored only inside saved searches (P3) by the caller.
- **PS-044-07.R02** Compilation output is never logged with parameter values.
- **PS-044-07.R03** Hostile filter input cannot inject SQL or trigger unbounded work.

## Specification

**Data classification**
- Filter values: not personal data on their own; combined with a saved search they are P3 and handled by F06.S01.M02.

**Retention**
- No retention; the library keeps no state.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | SQL injection through filter values | only bound parameters, SQL from a fixed fragment table, fuzz test of 10 000 values |
| T02 | Resource exhaustion through huge category or id lists | list maxima 10, 200 expanded ids, 256 KiB body limit from CTR-SCH-001 |
| T03 | Exact-distance oracle through distance filters | distanceKm only from the fixed set and compiled to cell sets, never to numeric distance comparisons |

**Abuse controls**
- Callers apply rate limits; the library caps work per call at 200 category ids, 512 cells and 10 list items.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T06 | integration | PS-044-01.R02, PS-044-07.R01 | compiled filter run against SQLite with 1 000 documents | returned set equals a brute-force JavaScript filter of the same data |
| TEST-PS-044-09.T07 | abuse | PS-044-07.R02, PS-044-07.R03, PS-044-08.R01 | 10 000 fuzz strings with SQL metacharacters and 5 000-item lists | no SQL injection, errors for oversize lists, validation under 1 ms p95 |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
