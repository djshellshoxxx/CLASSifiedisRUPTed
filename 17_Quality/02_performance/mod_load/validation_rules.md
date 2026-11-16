# PS-139-02 — Validation rules: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-02.R01** Each scenario has a declared target (rate, duration, p95 budget) and the verdict is pass only when measured p95 is at most the budget and error rate at most 0.1 %.
- **PS-139-02.R02** The driver rejects runs that are invalid: generator CPU above 70 %, achieved rate below 95 % of target, or less than the profile duration.
- **PS-139-02.R03** The load script refuses to run against any host not on the explicit allow list (localhost and the CI relay) with a typed error.
- **PS-139-02.R04** The load script targets relay services only: signed public-projection index reads and writes, mailbox put and get of opaque encrypted envelopes, matching over public projections, content-free push enqueue and auction hosting; the relay never receives plaintext P2+ data in the test.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Measured p95 is at most the OBS-4 budget for the scenario | QUALITY_LOAD_BUDGET_EXCEEDED |
| V02 | Error rate is at most 0.1 % and no 429 occurs on the load tenant | QUALITY_LOAD_ERROR_RATE |
| V03 | Generator CPU is at most 70 % and achieved rate at least 95 % of target | QUALITY_LOAD_INVALID_RUN |
| V04 | Target host is on the allow list (localhost or CI relay) | QUALITY_LOAD_HOST_FORBIDDEN |
| V05 | Seed dataset version matches the current schema version | QUALITY_LOAD_SEED_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T03 | unit | PS-139-02.R01, PS-139-09.R02 | stub server with known latencies (p95 100 ms) | computed p95 within 2 % and verdict correct |
| TEST-PS-139-09.T04 | unit | PS-139-02.R02 | force generator CPU 80 percent and achieved rate 90 percent | QUALITY_LOAD_INVALID_RUN and exit 2 |
| TEST-PS-139-09.T05 | abuse | PS-139-02.R03, PS-139-05.R03 | point the driver at a non-allow-listed host | QUALITY_LOAD_HOST_FORBIDDEN and exit 3 |
| TEST-PS-139-09.T14 | load | PS-139-02.R01 | reference run of read, write, search and cycle scenarios | p95 within OBS-4 budgets and error rate at most 0.1 % |
| TEST-PS-139-09.T17 | integration | PS-139-02.R04 | inspect request bodies sent to the relay during a smoke run | only signed public projections and opaque encrypted envelopes; no plaintext P2+ canary |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
