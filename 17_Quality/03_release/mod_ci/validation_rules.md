# PS-141-02 — Validation rules: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-02.R01** The workflow lint rejects: any uses: outside actions/*, missing permissions block, permissions broader than contents: read (except documented artifact write), pull_request_target triggers, missing concurrency cancel-in-progress, and missing timeout-minutes.
- **PS-141-02.R02** The fast gate must contain jobs in order install, spec-check, typecheck, test (unit, property, integration), build-pwa and e2e-smoke, where each depends on install.
- **PS-141-02.R03** Branch protection requires the single check gate-summary, which fails if any required job failed or was cancelled.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every uses: references an action in the actions/ organization | QUALITY_CI_ACTION_FORBIDDEN |
| V02 | Workflow has permissions contents: read, concurrency with cancel-in-progress true and timeout-minutes | QUALITY_CI_WORKFLOW_INVALID |
| V03 | e2e job downloads the pwa-dist artifact and never runs the build | QUALITY_CI_ARTIFACT_MISSING |
| V04 | Docs-only change skips test jobs and a change to a module.spec.yaml runs spec-check | QUALITY_CI_PATH_FILTER_WRONG |
| V05 | Fast gate p95 duration is at most 10 min on a warm cache | QUALITY_CI_GATE_TOO_SLOW |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T02 | unit | PS-141-02.R01 | lint 8 bad fixtures: third-party action, missing permissions, broad permissions, pull_request_target, no concurrency, no timeout | each rejected with its code |
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | install precedes all; e2e-smoke needs build-pwa; triggers include push, pull_request, workflow_dispatch, schedule for nightly |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate run with one failed and one skipped-by-filter job | gate-summary fails for failure and passes for path-filter skip |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
