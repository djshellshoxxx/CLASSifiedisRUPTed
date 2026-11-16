# PS-139-06 — Failure recovery and idempotency: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-06.R01** Runs are repeatable: a fresh relay and database are created per run and the seed is deterministic.
- **PS-139-06.R02** Write scenarios use unique Idempotency-Keys per request and also replay 1 % of requests with the same key to verify idempotency under load.
- **PS-139-06.R03** If the relay crashes mid-run, the run is invalid, exit 2, and the relay log tail is saved.

## Specification

- **idempotency:** A load run is self-contained; re-running seeds a fresh database. Seeding is idempotent by deterministic IDs.
- **concurrency:** The driver uses an open-loop scheduler with up to 256 in-flight connections; the number of in-flight requests is recorded in the report.
- **retries:** The driver never retries failed requests (a retry would hide errors); a run with failures reports them.
- **offline:** Not applicable: load runs need only localhost. The scenario fails fast if the relay is unreachable within 10 s.
- **partial failure:** If a scenario fails to start, other scenarios still run and the report marks the failed one; the final exit code is the worst code seen.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T07 | load | PS-139-03.R03, PS-139-06.R03 | soak against the relay with a planted memory leak | growth above 10 % flagged and exit 1 |
| TEST-PS-139-09.T10 | integration | PS-139-06.R01, PS-139-06.R02 | replay 1 percent of write requests with the same key | identical responses, no duplicate records |
| TEST-PS-139-09.T11 | chaos | PS-139-06.R03 | kill the relay mid-run | run invalid, exit 2, log tail saved |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
