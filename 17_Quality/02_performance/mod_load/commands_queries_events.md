# PS-139-04 — Commands, queries and events: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-04.R01** The module exposes pnpm load:smoke, pnpm load:standard, pnpm load:soak and pnpm load --scenario <name>.
- **PS-139-04.R02** Scenarios are read_index, write_index, write_mailbox, search_text, search_geo, cycle_search, auction_bid and mixed_70_30.
- **PS-139-04.R03** Exit codes: 0 pass, 1 budget failure, 2 invalid run, 3 configuration or seed failure.

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
| QUALITY_LOAD_BUDGET_EXCEEDED | 422 | no | a scenario p95 exceeded its OBS-4 budget (exit 1) |
| QUALITY_LOAD_ERROR_RATE | 422 | no | error rate above 0.1 % or rate limiting hit (exit 1) |
| QUALITY_LOAD_INVALID_RUN | 422 | no | generator saturated or target rate not achieved (exit 2) |
| QUALITY_LOAD_HOST_FORBIDDEN | 403 | no | target host not on the allow list (exit 3) |
| QUALITY_LOAD_SEED_STALE | 409 | no | seed dataset built for another schema version (exit 3) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm load:standard
  read_index   50 req/s  p95 88 ms  budget 150 ms  OK
  write_index  50 req/s  p95 212 ms budget 300 ms  OK  (50 000 signatures verified)
  write_mailbox    50 req/s  p95 241 ms budget 300 ms  OK
  auction_bid  50 req/s  p95 198 ms budget 300 ms  OK  (host-signed receipts)
  search_text    p95 176 ms budget 200 ms  OK
  cycle_search   5000 edges len5 p95 301 ms budget 250 ms  QUALITY_LOAD_BUDGET_EXCEEDED
  exit 1  report reports/load.json
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T06 | unit | PS-139-03.R01, PS-139-03.R02, PS-139-04.R03 | run phases with a stub relay | warm-up discarded; exit codes follow the documented mapping |
| TEST-PS-139-09.T08 | load | PS-139-04.R01, PS-139-04.R02, PS-139-08.R03 | run all eight scenarios under smoke and standard | each scenario reports; durations within 3 and 15 min |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, F17.S01.M01, F15.S02.M01, F15.S02.M03, F12.S03.M03, F11.S01.M02, F08.S01.M01, F04.S01.M02, F07.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
