# PS-139-09 — Contract and acceptance tests: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-139-09.R02** Self-tests run the driver against a stub server with known latencies to prove percentile computation within 2 %.
- **PS-139-09.R03** A planted slowdown of 400 ms in write handling must turn the write scenario red.

## Specification

See the module test table below (all processes).

**Fixtures:** Seed 20261104: 100 000 listings, 10 000 actors, 5 000 edges; reference runner 2 vCPU / 4 GB, SQLite WAL; scenario mix read 70 percent, write 30 percent.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T01 | unit | PS-139-01.R01, PS-139-01.R02, PS-139-08.R02 | generate a report from a recorded run | schema valid; environment fields and scraped metrics present |
| TEST-PS-139-09.T02 | unit | PS-139-01.R03 | seed twice with seed 20261104 | identical dataset hashes |
| TEST-PS-139-09.T03 | unit | PS-139-02.R01, PS-139-09.R02 | stub server with known latencies (p95 100 ms) | computed p95 within 2 % and verdict correct |
| TEST-PS-139-09.T04 | unit | PS-139-02.R02 | force generator CPU 80 percent and achieved rate 90 percent | QUALITY_LOAD_INVALID_RUN and exit 2 |
| TEST-PS-139-09.T05 | abuse | PS-139-02.R03, PS-139-05.R03 | point the driver at a non-allow-listed host | QUALITY_LOAD_HOST_FORBIDDEN and exit 3 |
| TEST-PS-139-09.T06 | unit | PS-139-03.R01, PS-139-03.R02, PS-139-04.R03 | run phases with a stub relay | warm-up discarded; exit codes follow the documented mapping |
| TEST-PS-139-09.T07 | load | PS-139-03.R03, PS-139-06.R03 | soak against the relay with a planted memory leak | growth above 10 % flagged and exit 1 |
| TEST-PS-139-09.T08 | load | PS-139-04.R01, PS-139-04.R02, PS-139-08.R03 | run all six scenarios under smoke and standard | each scenario reports; durations within 3 and 15 min |
| TEST-PS-139-09.T09 | integration | PS-139-05.R01, PS-139-05.R02 | inspect token and limits used | device-key relay access token only; raised relay limits recorded in report |
| TEST-PS-139-09.T10 | integration | PS-139-06.R01, PS-139-06.R02 | replay 1 percent of write requests with the same key | identical responses, no duplicate records |
| TEST-PS-139-09.T11 | chaos | PS-139-06.R03 | kill the relay mid-run | run invalid, exit 2, log tail saved |
| TEST-PS-139-09.T12 | abuse | PS-139-07.R01, PS-139-07.R02, PS-139-07.R03 | scan report and relay logs for canaries and retention config | no canary; reports kept 90 days |
| TEST-PS-139-09.T13 | load | PS-139-08.R01, PS-139-09.R03 | planted 400 ms write slowdown at 50 req/s for 5 min | write_mailbox p95 above 300 ms and verdict red |
| TEST-PS-139-09.T14 | load | PS-139-02.R01 | reference run of read, write, search and cycle scenarios | p95 within OBS-4 budgets and error rate at most 0.1 % |
| TEST-PS-139-09.T15 | integration | PS-139-09.R01 | traceability tool run | every requirement maps to a passing test |
| TEST-PS-139-09.T16 | integration | PS-139-10.R01, PS-139-10.R02, PS-139-10.R03 | gates module parses a v1 report with an extra unknown field; budget file changed by commit | parsed successfully; budgets unchanged without contract change |
| TEST-PS-139-09.T17 | integration | PS-139-02.R04 | inspect request bodies sent to the relay during a smoke run | only signed public projections and opaque encrypted envelopes; no plaintext P2+ canary |

## Acceptance criteria

- On the 2 vCPU reference runner all OBS-4 budgets pass at 50 req/s.
- A planted 400 ms slowdown is detected as a budget failure with exit 1.
- The load script refuses to run against any non-allow-listed host.
- Reports are machine-readable and consumed by the release gates.

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
