# PS-141-02 — Validation rules: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-02.R01** The workflow lint rejects: any uses: outside actions/*, missing permissions block, permissions broader than contents: read except the per-job allowlist (issues: write only on the nightly-report job of nightly.yml; contents: write only on the release-publish job of release.yml, which needs the gates job; never a write permission on a job reachable from pull_request), pull_request_target triggers, workflow-level paths-ignore or paths filters on ci.yml, missing concurrency cancel-in-progress, and missing timeout-minutes.
- **PS-141-02.R02** The fast gate must contain jobs changes, install, spec-check, typecheck, test (unit, property, integration), offline (pnpm test:offline, fake network, under 30 s, on every pull request), build-pwa, offline-browser (pnpm test:offline:browser after build-pwa when pwa_changed), e2e-smoke and gate-summary, where every job after changes depends on changes and install.
- **PS-141-02.R03** Branch protection requires the single check gate-summary, which runs with if: always() and passes only when every job succeeded or was skipped because of a changes output; it fails if any job failed, was cancelled or was skipped for any other reason.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every uses: references an action in the actions/ organization | QUALITY_CI_ACTION_FORBIDDEN |
| V02 | Workflow has default permissions contents: read, any write permission only on an allowlisted job (nightly-report issues: write, release-publish contents: write) and none on a pull_request-reachable job, concurrency with cancel-in-progress true and timeout-minutes | QUALITY_CI_WORKFLOW_INVALID |
| V03 | e2e job downloads the pwa-dist artifact and never runs the build | QUALITY_CI_ARTIFACT_MISSING |
| V04 | ci.yml has no workflow-level paths-ignore; the changes job diffs against the fetched base; a docs-only change skips test jobs with gate-summary success; a change to any module.spec.yaml, planning/modules.yaml, planning/contracts/*.md or tools/specgen runs spec-check; secret scanning uses the same diff | QUALITY_CI_PATH_FILTER_WRONG |
| V05 | Fast gate p95 duration is at most 10 min on a warm cache | QUALITY_CI_GATE_TOO_SLOW |
| V06 | The fast gate runs pnpm test:offline on every pull request and pnpm test:offline:browser after build-pwa when pwa_changed, both counted by gate-summary, and weekly.yml runs load soak with timeout-minutes 90 on schedule only | QUALITY_CI_JOB_MISSING |
| V07 | release.yml runs every evidence suite on the release commit, downloads all reports into one directory before gates:release, and runs release-publish only after GO | QUALITY_CI_RELEASE_EVIDENCE_MISSING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T02 | unit | PS-141-02.R01 | lint the good fixtures and 11 bad fixtures - third-party action, missing permissions, broad workflow permissions, issues: write on a pull_request job, contents: write outside release-publish, pull-requests: write anywhere, release-publish without needs on the gates job, workflow-level paths-ignore, pull_request_target, no concurrency, no timeout | good fixtures (nightly-report issues: write, release-publish contents: write) accepted; each bad fixture rejected with its code |
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | changes precedes all; install precedes test jobs; offline runs on every pull request; offline-browser and e2e-smoke need build-pwa; gate-summary has if: always(); triggers include push, pull_request, workflow_dispatch, schedules for nightly and weekly, and v* tags for release |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate runs with one failed job, one job skipped by a changes output and one job skipped for another reason | gate-summary fails for the failure and for the unexplained skip, and passes for the changes skip |
| TEST-PS-141-09.T15 | unit | PS-141-02.R02 | lint fixtures without the offline job, with offline-browser not counted by gate-summary, and with soak scheduled nightly at 60 min | each fails with QUALITY_CI_JOB_MISSING; the good weekly.yml with timeout-minutes 90 passes |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
