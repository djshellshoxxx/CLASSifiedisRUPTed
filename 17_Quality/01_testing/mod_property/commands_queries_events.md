# PS-136-04 — Commands, queries and events: Property testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M02 Property testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/property` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-136-04.R01** The module exposes pnpm test:property (pr profile) and pnpm test:property:nightly (10 000 runs) and pnpm test:property --seed <n> --path <p> for replay.
- **PS-136-04.R02** No relay commands or events exist; outputs are reports/property.json and JUnit XML.
- **PS-136-04.R03** Exit codes: 0 pass, 1 counterexample found, 2 timeout, 3 profile misconfiguration.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_PROP_RUNS_TOO_LOW | 422 | no | property configured with fewer runs than its profile requires (exit 3) |
| QUALITY_PROP_TITLE_INVALID | 422 | no | property title is not a valid TEST ID (exit 3) |
| QUALITY_PROP_TIMEOUT | 422 | no | property exceeded its time budget (exit 2) |
| QUALITY_PROP_ARBITRARY_INVALID | 422 | no | arbitrary produced a value outside its declared schema (exit 1) |
| QUALITY_PROP_REGRESSION_STALE | 422 | no | stored regression case no longer replays as recorded (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:property
  TEST-PS-136-09.T03 money split conserves total   200 runs  seed 8841207  OK
  TEST-PS-136-09.T07 cycle result is a valid cycle  200 runs  FAIL path 14:3 shrunk [A->B,B->A]
  exit 1
$ pnpm test:property --seed 8841207 --path 14:3
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-136-09.T04 | unit | PS-136-02.R03, PS-136-04.R03 | property sleeping 11 s in pr profile | aborted with QUALITY_PROP_TIMEOUT and exit 2 |
| TEST-PS-136-09.T07 | unit | PS-136-04.R01, PS-136-04.R02 | invoke each documented script | reports/property.json and JUnit exist; exit codes as documented |

## Dependencies

Module depends on: CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
