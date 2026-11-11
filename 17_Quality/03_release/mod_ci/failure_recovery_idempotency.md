# PS-141-06 — Failure recovery and idempotency: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-06.R01** Re-running a failed job is safe because every job is a pure function of the commit; artifacts are overwritten by name.
- **PS-141-06.R02** Cache and artifact steps use continue-on-error false for artifacts and true for cache restore, so cache outages slow the build but do not fail it.
- **PS-141-06.R03** Infrastructure failures (runner lost, cache service error) are retried once automatically by re-run; assertion failures are never retried.

## Specification

- **idempotency:** Jobs are pure functions of the commit; re-runs produce the same result and overwrite artifacts of the same name.
- **concurrency:** concurrency group ci-<workflow>-<ref> with cancel-in-progress true for the gate; nightly uses a separate group without cancellation.
- **retries:** Only infrastructure failures (runner loss, cache service) are re-run once; test failures are never retried at job level.
- **offline:** CI has network access to the registry only through pnpm install; tests themselves run with network egress denied by the test guards.
- **partial failure:** If any job fails the gate-summary fails and artifacts of earlier jobs remain available for debugging; a skipped job counts as success only when it was skipped because of a changes job output.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T08 | integration | PS-141-06.R01, PS-141-06.R02, PS-141-06.R03 | re-run a job; simulate cache outage, an artifact upload failure and runner loss | same result; cache restore failure slows but passes (continue-on-error true); artifact upload failure fails the job (continue-on-error false); infrastructure failure re-run once |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
