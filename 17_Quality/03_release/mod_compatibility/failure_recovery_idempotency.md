# PS-142-06 — Failure recovery and idempotency: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-06.R01** The vault upgrade is idempotent: running it twice leaves identical data, and an interrupted upgrade resumes without duplicating records.
- **PS-142-06.R02** Rollback of the app to N-1 after upgrade is tested for additive-only changes: N-1 code reads N vault data, ignoring unknown optional fields.
- **PS-142-06.R03** The matrix runner retries a cell once for infrastructure failure only.

## Specification

- **idempotency:** The vault upgrade is idempotent and the compat suite re-creates vaults from fixtures on each run, so re-runs are safe.
- **concurrency:** Browser matrix cells run in parallel (max 6 workers) with isolated profiles; N-1 tests are sequential per fixture set.
- **retries:** A matrix cell is retried once for infrastructure failures (browser download, runner loss), never for assertion failures.
- **offline:** N-1 data and schema tests run fully offline; the browser matrix needs the nightly runner to have the browser builds cached.
- **partial failure:** If one cell or fixture set fails, all others still run and the report lists every failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T02 | integration | PS-142-02.R01, PS-142-06.R02 | upgrade the N-1 vault and validate all records and signatures; open N vault with N-1 code | all records valid and signatures verify; N-1 ignores unknown optional fields |
| TEST-PS-142-09.T05 | chaos | PS-142-03.R01, PS-142-06.R01 | interrupt vault upgrade at each step, then restart | resumes or rolls back; zero lost and zero duplicated records; second upgrade identical |
| TEST-PS-142-09.T09 | unit | PS-142-06.R03 | force an infrastructure failure on one cell | retried once; assertion failure not retried |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
