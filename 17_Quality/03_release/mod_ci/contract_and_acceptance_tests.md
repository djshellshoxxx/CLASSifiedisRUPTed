# PS-141-09 — Contract and acceptance tests: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-141-09.R02** The workflow lint is unit-tested with good and bad workflow fixtures, and dry-run in CI on every change to .github.
- **PS-141-09.R03** A canary pull request fixture proves that docs-only changes skip tests and spec YAML changes run spec:check.

## Specification

See the module test table below (all processes).

**Fixtures:** Workflow fixtures under tools/ci-lint/fixtures (good.yml and 8 bad variants), a changed-files fixture list for path filter checks, a recorded timing set of 20 runs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T01 | unit | PS-141-01.R01, PS-141-01.R02, PS-141-01.R03 | lint good workflow fixtures and check artifact names, retention and env pins | all accepted; names and pins verified |
| TEST-PS-141-09.T02 | unit | PS-141-02.R01 | lint 8 bad fixtures: third-party action, missing permissions, broad permissions, pull_request_target, no concurrency, no timeout | each rejected with its code |
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | install precedes all; e2e-smoke needs build-pwa; triggers include push, pull_request, workflow_dispatch, schedule for nightly |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate run with one failed and one skipped-by-filter job | gate-summary fails for failure and passes for path-filter skip |
| TEST-PS-141-09.T05 | integration | PS-141-03.R02, PS-141-06.R02 | nightly failure then success | one nightly-failure issue opened, updated, then closed |
| TEST-PS-141-09.T06 | unit | PS-141-04.R02, PS-141-04.R03 | read package scripts and release workflow | ci:fast, ci:nightly exist; release calls gates:release and propagates exit code |
| TEST-PS-141-09.T07 | abuse | PS-141-05.R01, PS-141-05.R02, PS-141-05.R03 | scan workflows for secrets, deploy steps and credentials; plant a secret in the diff | no secrets or deploys; planted secret fails the secrets step |
| TEST-PS-141-09.T08 | integration | PS-141-06.R01, PS-141-06.R03 | re-run a job; simulate cache outage and runner loss | same result; cache outage slows but passes; infrastructure failure re-run once |
| TEST-PS-141-09.T09 | abuse | PS-141-07.R01, PS-141-07.R02, PS-141-07.R03 | review fork run logs and artifact contents; check retention config | tokens masked; no user data; retention 7, 14, 30 days |
| TEST-PS-141-09.T10 | load | PS-141-08.R01, PS-141-08.R02 | timings of 20 recorded fast-gate runs | p95 at most 10 min; cache hit ratio reported |
| TEST-PS-141-09.T11 | unit | PS-141-08.R03 | build artifact exceeding 150 KiB gzip initial JS | build job fails |
| TEST-PS-141-09.T12 | integration | PS-141-09.R01, PS-141-09.R02, PS-141-09.R03 | canary pull requests: docs-only, spec YAML change, code change | docs-only skips tests; spec change runs spec:check; code change runs everything |
| TEST-PS-141-09.T13 | integration | PS-141-10.R01, PS-141-10.R02, PS-141-10.R03 | introduce a new workflow in a branch and revert | lint validates before merge; revert restores prior behavior |

## Acceptance criteria

- The fast gate runs install, spec:check, typecheck, unit, property, integration, a single PWA build and e2e smoke without a relay, and finishes in at most 10 min p95.
- A docs-only pull request skips the test jobs while a spec YAML change still runs spec:check.
- Only first-party actions are used and no pull request workflow has secrets or write permissions.
- The nightly workflow runs long property, load, chaos and compatibility jobs and publishes reports.

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
