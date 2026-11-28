# PS-141-04 — Commands, queries and events: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-04.R01** The module exposes workflow triggers: push, pull_request (opened, synchronize, reopened), workflow_dispatch, schedule for nightly and weekly, and push of a v* tag for release.
- **PS-141-04.R02** Reusable scripts are pnpm ci:fast, pnpm ci:nightly, pnpm ci:weekly and pnpm ci:release so that developers can reproduce a gate locally; the YAML only calls these scripts.
- **PS-141-04.R03** The release workflow first regenerates all evidence on the release commit (fast suites, property nightly profile, load smoke and standard, chaos smoke, compatibility data, schema diff and browser matrix, e2e full with axe and test:e2e:budgets, specgen check --strict --report), downloads every report into one reports/ directory, then calls pnpm gates:release from F17.S03.M02 and fails on a non-zero exit; release-publish runs only after GO.

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
| QUALITY_CI_ACTION_FORBIDDEN | 422 | no | workflow uses a non first-party action (lint exit 3) |
| QUALITY_CI_WORKFLOW_INVALID | 422 | no | workflow lacks permissions, concurrency or timeout (lint exit 3) |
| QUALITY_CI_ARTIFACT_MISSING | 422 | no | pwa-dist artifact missing in e2e job (job fails) |
| QUALITY_CI_PATH_FILTER_WRONG | 422 | no | path filter does not match the documented rule (lint exit 3) |
| QUALITY_CI_GATE_TOO_SLOW | 422 | no | fast gate p95 exceeded 10 min (reported, exit 1 in the weekly check) |
| QUALITY_CI_JOB_MISSING | 422 | no | a required job (offline, offline-browser, weekly soak) is missing, wrongly triggered or not counted by gate-summary (lint exit 3) |
| QUALITY_CI_RELEASE_EVIDENCE_MISSING | 422 | no | the release workflow does not regenerate an evidence report on the release commit before gates:release, or publishes before GO (lint exit 3) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm ci:fast
  changes (base 3f2a9c1..HEAD): docs_only=false spec_changed=true pwa_changed=true
  install 41 s (cache hit) | spec:check 0 errors | typecheck 38 s | unit/property/integration 3 min 12 s | offline 21 s | build-pwa 74 s
  offline-browser 2 min 10 s | e2e-smoke (pwa-dist, no relay) 82 s  | gate-summary OK  total 7 min 4 s
$ pnpm ci:fast   # docs-only pull request
  changes: docs_only=true -> test jobs skipped by changes output | gate-summary OK
$ node tools/ci-lint .github/workflows
  ci.yml OK  nightly.yml OK (nightly-report: issues write allowlisted)  weekly.yml OK  release.yml OK (release-publish: contents write allowlisted, needs collect)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | changes precedes all; install precedes test jobs; offline runs on every pull request; offline-browser and e2e-smoke need build-pwa; gate-summary has if: always(); triggers include push, pull_request, workflow_dispatch, schedules for nightly and weekly, and v* tags for release |
| TEST-PS-141-09.T06 | unit | PS-141-04.R02, PS-141-04.R03 | read package scripts and release workflow | ci:fast, ci:nightly, ci:weekly, ci:release exist; release regenerates every report on the release commit, downloads them before gates:release and propagates its exit code |
| TEST-PS-141-09.T14 | integration | PS-141-03.R04, PS-141-04.R03 | release workflow dry run on a tag | every evidence job runs on the tagged commit, collect downloads all reports into one directory and runs gates:release, release-publish runs only after GO; a fixture missing the load job fails lint with QUALITY_CI_RELEASE_EVIDENCE_MISSING |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
