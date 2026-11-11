# F17.S03.M01 — Continuous integration

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S03](../SPEC.md). **Process IDs:** PS-141-01…PS-141-10. **Code:** `.github/workflows`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

GitHub Actions workflows for ClassRup using only first-party actions (actions/checkout, actions/setup-node, actions/cache, actions/upload-artifact, actions/download-artifact). One fast Linux gate runs on every push and pull request: a changes job diffs against the fetched base commit, then install from a cached pnpm 10.28.0 store on Node 22, spec:check, typecheck, unit, property (200 runs), integration (multi-vault with optional relay), offline (fake network), PWA build once, offline browser when apps/pwa changed, then e2e smoke against the built artifact with no relay configured, and an always-run gate-summary. A nightly schedule runs long property (10 000 runs), load standard, chaos (30 seeds), compatibility and the browser matrix; a weekly schedule runs the load soak; a release workflow regenerates every piece of evidence on the release commit before gates:release. Workflows default to read-only permissions with a per-job write allowlist and no secrets on pull requests.

## Responsibilities

- Provide .github/workflows/ci.yml: triggers push and pull_request, concurrency group ci-${{ github.workflow }}-${{ github.ref }} with cancel-in-progress true, permissions contents: read, timeout 15 min, runs-on ubuntu-24.04.
- Skip documentation-only work without workflow-level paths-ignore: a first-party first job changes (actions/checkout with fetch-depth 0, or git fetch --depth=1 origin of github.event.pull_request.base.sha) computes the changed files with git diff against the base and exposes outputs docs_only, spec_changed and pwa_changed; test jobs carry if: on those outputs, spec-check runs whenever spec_changed (any module.spec.yaml, planning/modules.yaml, planning/contracts/*.md or tools/specgen) or code changed, and gate-summary always runs.
- Build the PWA once in a build job (pnpm build:pwa), upload it with actions/upload-artifact (retention 7 days) and have the e2e job download and reuse that artifact instead of rebuilding.
- Provide .github/workflows/nightly.yml on cron 0 2 * * * running long property (10 000 runs), load (standard), chaos (30 seeds), compatibility (data, schema diff and browser matrix) and the offline browser suite, uploading reports with 30-day retention, plus a nightly-report job, the only job with issues: write, that opens or updates issues for failures, property counterexamples and flake quarantine proposals; and .github/workflows/weekly.yml on a weekly cron running pnpm load:soak with timeout-minutes 90.
- Use actions/checkout with fetch-depth 1 in test jobs and the base-commit fetch only in the changes job, and cache the pnpm store with actions/setup-node cache: pnpm or actions/cache keyed by hashFiles of pnpm-lock.yaml.
- Provide .github/workflows/release.yml, triggered by a pushed v* tag and by workflow_dispatch on the release commit: it runs the fast suites, the property nightly profile, load smoke then standard (budgets are release-gated), chaos smoke, compatibility (data, schema diff and browser matrix), e2e full with axe and pnpm test:e2e:budgets, and node tools/specgen/specgen.mjs check --strict --report; every job uploads its reports, a collect job downloads them into one reports/ directory and runs pnpm gates:release, and only after GO the release-publish job (contents: write) attaches reports/gates.md to the release.
- Maintain the per-job permission allowlist in tools/ci-lint: issues: write only on the schedule-triggered nightly-report job of nightly.yml, contents: write only on the release-publish job of release.yml that needs the gates job; no write permission on any job reachable from a pull_request trigger, and no workflow opens pull requests (a pull request created with GITHUB_TOKEN would not trigger CI).

## Not responsible for

- The content of the release gates (F17.S03.M02), which is invoked from the release workflow here.
- The tests themselves (F17.S01 and F17.S02).
- Deployment and hosting of relays (F15.S03); the PWA is static and relays are self-hosted.
- Future: self-hosted runners, macOS and Windows runners and required-reviewer deployment environments.
- Manual release checklists (gates/manual/<version>/ of F17.S03.M02, including the real Safari and iOS cells of F17.S03.M03) are signed by people; CI only uploads them with the other evidence.

## User stories

- As a developer, I push a commit and get a pass or fail from the fast gate within 10 minutes with the failing job and log linked.
- As a documentation writer, a pull request that only changes prose does not consume the test pipeline and its required check reports success, yet a spec YAML or contract change still runs spec:check.
- As a release manager, I tag a release and the release workflow produces fresh evidence for that exact commit before the gates run.
- As a maintainer, I find the nightly long-run reports as artifacts every morning.

## Edge cases

- Two pushes to the same branch arrive within a minute; the older run is cancelled by the concurrency group so only the newest finishes.
- A pull request from a fork must not receive secrets; workflows need none and use read-only permissions, with no pull_request_target usage.
- The pnpm cache misses after a lockfile change; install takes longer but still succeeds, and the cache is saved under the new key.
- A docs-only pull request still starts the workflow (there is no workflow-level paths-ignore); the changes job sets docs_only, the test jobs are skipped by their if:, and gate-summary (if: always()) reports success because every skip came from a changes output, so the required check never stays pending.
- A pull request touches only planning/contracts/CTR-IDM-001.md; spec_changed is true and spec-check runs although the file is markdown.
- The base commit is absent from a shallow clone; the changes job fetches github.event.pull_request.base.sha before git diff, and if the diff still cannot be computed it fails with QUALITY_CI_PATH_FILTER_WRONG instead of treating the change as docs-only.
- A release tag points at a commit whose nightly evidence is older than 24 h or from another SHA; the release workflow regenerates every report on that commit before gates:release.
- The build artifact upload fails; the e2e job fails explicitly with QUALITY_CI_ARTIFACT_MISSING instead of rebuilding silently.
- A third-party action is added to a workflow; the workflow lint rejects any uses: outside the actions/ organization with QUALITY_CI_ACTION_FORBIDDEN.

## UX and accessibility



Headless. Results appear as GitHub check runs and a job summary with timings, coverage and links to artifacts.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-141-01 | [Domain schema](domain_schema.md) | 3 |
| PS-141-02 | [Validation rules](validation_rules.md) | 3 |
| PS-141-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-141-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-141-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-141-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-141-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-141-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-141-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-141-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `.github/workflows/index.ts`.

## Acceptance criteria

- The fast gate runs changes, install, spec:check, typecheck, unit, property, integration, offline, a single PWA build, offline browser when apps/pwa changed and e2e smoke without a relay, and finishes in at most 10 min p95.
- A docs-only pull request skips the test jobs with gate-summary success, while a spec YAML or contract change still runs spec:check.
- Only first-party actions are used and no pull request workflow has secrets or write permissions.
- The nightly workflow runs long property, load, chaos and compatibility jobs and publishes reports, the weekly workflow runs the soak, and the release workflow regenerates all evidence on the release commit before gates:release.
