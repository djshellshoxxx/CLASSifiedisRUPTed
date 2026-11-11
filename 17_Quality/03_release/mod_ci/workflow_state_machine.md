# PS-141-03 — Workflow state machine: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-03.R01** A workflow run moves through queued, in progress, then success, failure or cancelled; cancelled by newer push is a normal outcome.
- **PS-141-03.R02** The nightly-report job, the only job holding issues: write, opens or updates one issue labelled nightly-failure when a long run fails and closes it when the next run passes; it also files property counterexamples and flake quarantine proposals as issues and never commits or opens pull requests.
- **PS-141-03.R03** Job dependency graph: changes, then install, then parallel spec-check, typecheck, unit-property-integration, offline and build-pwa, then e2e-smoke and offline-browser (if pwa_changed) after build-pwa, then gate-summary with if: always().
- **PS-141-03.R04** Release job graph on the tagged commit: install, then parallel fast suites, property-nightly, load (smoke then standard), chaos-smoke, compat (data, schema diff, browser matrix), e2e-full (with axe and test:e2e:budgets) and spec-report (specgen check --strict --report), then collect (download all reports into reports/ and run pnpm gates:release), then release-publish only when collect returned GO.

## Specification

**Note:** Tooling module: no domain entity has a lifecycle. Runs are stateless processes that exit 0 (pass) or non-zero (fail).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T03 | unit | PS-141-02.R02, PS-141-03.R03, PS-141-04.R01 | parse ci.yml job graph and triggers | changes precedes all; install precedes test jobs; offline runs on every pull request; offline-browser and e2e-smoke need build-pwa; gate-summary has if: always(); triggers include push, pull_request, workflow_dispatch, schedules for nightly and weekly, and v* tags for release |
| TEST-PS-141-09.T04 | integration | PS-141-02.R03, PS-141-03.R01 | simulate runs with one failed job, one job skipped by a changes output and one job skipped for another reason | gate-summary fails for the failure and for the unexplained skip, and passes for the changes skip |
| TEST-PS-141-09.T05 | integration | PS-141-03.R02 | nightly failure then success | one nightly-failure issue opened, updated, then closed by the nightly-report job; nothing committed and no pull request opened |
| TEST-PS-141-09.T14 | integration | PS-141-03.R04, PS-141-04.R03 | release workflow dry run on a tag | every evidence job runs on the tagged commit, collect downloads all reports into one directory and runs gates:release, release-publish runs only after GO; a fixture missing the load job fails lint with QUALITY_CI_RELEASE_EVIDENCE_MISSING |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
