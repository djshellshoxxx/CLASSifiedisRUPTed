# PS-141-09 — Contract and acceptance tests: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-09.R01** Every requirement of this module is covered by at least one automated test using the mapping in section 09.
- **PS-141-09.R02** The workflow lint is unit-tested with good and bad workflow fixtures, and dry-run in CI on every change to .github.
- **PS-141-09.R03** A canary pull request fixture proves that docs-only changes skip tests and spec YAML changes run spec:check.

## Specification

See the module test table below (all processes).

**Fixtures:** Workflow fixtures under tools/ci-lint/fixtures (good ci.yml, nightly.yml with an allowlisted nightly-report job, weekly.yml, release.yml with an allowlisted release-publish job, and 11 bad variants), base and head commits for changes-job checks (docs-only, planning/contracts only, module.spec.yaml, apps/pwa, code), a recorded timing set of 20 runs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T01 | unit | PS-141-01.R01, PS-141-01.R02, PS-141-01.R03 | lint good workflow fixtures and check artifact names, retention and env pins | all accepted; names and pins verified |
| TEST-PS-141-09.T02 | unit | PS-141-02.R01 | lint the good fixtures and 11 bad fixtures - third-party action, missing permissions, broad workflow permissions, issues: write on a pull_request job, contents: write outside release-publish, pull-requests: write anywhere, release-publish without needs on the gates job, workflow-level paths-ignore, pull_request_target, no concurrency, no timeout | good fixtures (nightly-report issues: write, release-publish contents: write) accepted; each bad fixture rejected with its code |
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | changes precedes all; install precedes test jobs; offline runs on every pull request; offline-browser and e2e-smoke need build-pwa; gate-summary has if: always(); triggers include push, pull_request, workflow_dispatch, schedules for nightly and weekly, and v* tags for release |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate runs with one failed job, one job skipped by a changes output and one job skipped for another reason | gate-summary fails for the failure and for the unexplained skip, and passes for the changes skip |
| TEST-PS-141-09.T05 | integration | PS-141-03.R02 | nightly failure then success | one nightly-failure issue opened, updated, then closed by the nightly-report job; nothing committed and no pull request opened |
| TEST-PS-141-09.T06 | unit | PS-141-04.R02, PS-141-04.R03 | read package scripts and release workflow | ci:fast, ci:nightly, ci:weekly, ci:release exist; release regenerates every report on the release commit, downloads them before gates:release and propagates its exit code |
| TEST-PS-141-09.T07 | abuse | PS-141-05.R01, PS-141-05.R02, PS-141-05.R03 | scan workflows for secrets, deploy steps, credentials and write permissions; plant a secret in a pull request diff | no secrets or deploys; write permissions only on allowlisted jobs; the secrets step scans the diff against the fetched base and the planted secret fails it |
| TEST-PS-141-09.T08 | integration | PS-141-06.R01, PS-141-06.R02, PS-141-06.R03 | re-run a job; simulate cache outage, an artifact upload failure and runner loss | same result; cache restore failure slows but passes (continue-on-error true); artifact upload failure fails the job (continue-on-error false); infrastructure failure re-run once |
| TEST-PS-141-09.T09 | abuse | PS-141-07.R01, PS-141-07.R02, PS-141-07.R03 | review fork run logs and artifact contents; check retention config | tokens masked; no user data; retention 7, 14, 30 days |
| TEST-PS-141-09.T10 | load | PS-141-08.R01, PS-141-08.R02 | timings of 20 recorded fast-gate runs | p95 at most 10 min; cache hit ratio reported |
| TEST-PS-141-09.T11 | unit | PS-141-08.R03 | build artifact exceeding 150 KiB gzip initial JS | build job fails |
| TEST-PS-141-09.T12 | integration | PS-141-09.R01, PS-141-09.R02, PS-141-09.R03 | canary pull requests - docs-only, planning/contracts/*.md only, spec YAML change, apps/pwa change, code change | docs-only skips tests and gate-summary reports success (no pending check); contracts-only and spec change run spec-check; apps/pwa change runs offline-browser; code change runs everything |
| TEST-PS-141-09.T14 | integration | PS-141-03.R04, PS-141-04.R03 | release workflow dry run on a tag | every evidence job runs on the tagged commit, collect downloads all reports into one directory and runs gates:release, release-publish runs only after GO; a fixture missing the load job fails lint with QUALITY_CI_RELEASE_EVIDENCE_MISSING |
| TEST-PS-141-09.T15 | unit | PS-141-02.R02 | lint fixtures without the offline job, with offline-browser not counted by gate-summary, and with soak scheduled nightly at 60 min | each fails with QUALITY_CI_JOB_MISSING; the good weekly.yml with timeout-minutes 90 passes |
| TEST-PS-141-09.T13 | integration | PS-141-10.R01, PS-141-10.R02, PS-141-10.R03 | introduce a new workflow in a branch and revert | lint validates before merge; revert restores prior behavior |

## Acceptance criteria

- The fast gate runs changes, install, spec:check, typecheck, unit, property, integration, offline, a single PWA build, offline browser when apps/pwa changed and e2e smoke without a relay, and finishes in at most 10 min p95.
- A docs-only pull request skips the test jobs with gate-summary success, while a spec YAML or contract change still runs spec:check.
- Only first-party actions are used and no pull request workflow has secrets or write permissions.
- The nightly workflow runs long property, load, chaos and compatibility jobs and publishes reports, the weekly workflow runs the soak, and the release workflow regenerates all evidence on the release commit before gates:release.

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
