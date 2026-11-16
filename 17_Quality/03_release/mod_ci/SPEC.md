# F17.S03.M01 — Continuous integration

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S03](../SPEC.md). **Process IDs:** PS-141-01…PS-141-10. **Code:** `.github/workflows`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

GitHub Actions workflows for ClassRup using only first-party actions (actions/checkout, actions/setup-node, actions/cache, actions/upload-artifact, actions/download-artifact). One fast Linux gate runs on every push and pull request: install from a cached pnpm 10.28.0 store on Node 22, spec:check, typecheck, unit, property (200 runs), integration (multi-vault with optional relay), PWA build once, then e2e smoke against the built artifact with no relay configured. A nightly schedule runs long property (10 000 runs), load, chaos and the browser matrix. Workflows run with read-only permissions and no secrets on pull requests.

## Responsibilities

- Provide .github/workflows/ci.yml: triggers push and pull_request, concurrency group ci-${{ github.workflow }}-${{ github.ref }} with cancel-in-progress true, permissions contents: read, timeout 15 min, runs-on ubuntu-24.04.
- Skip documentation-only changes with paths-ignore for docs, markdown and planning files, except that changes to any module.spec.yaml, planning/modules.yaml, planning/contracts or tools/specgen still run the spec:check job.
- Build the PWA once in a build job (pnpm build:pwa), upload it with actions/upload-artifact (retention 7 days) and have the e2e job download and reuse that artifact instead of rebuilding.
- Provide .github/workflows/nightly.yml on cron 0 2 * * * running long property (10 000 runs), load (standard), chaos (30 seeds), compatibility matrix and the offline suite, uploading reports with 30-day retention.
- Use actions/checkout with fetch-depth 1 and cache the pnpm store with actions/setup-node cache: pnpm or actions/cache keyed by hashFiles of pnpm-lock.yaml.

## Not responsible for

- The content of the release gates (F17.S03.M02), which is invoked from the release workflow here.
- The tests themselves (F17.S01 and F17.S02).
- Deployment and hosting of relays (F15.S03); the PWA is static and relays are self-hosted.
- Future: self-hosted runners, macOS and Windows runners and required-reviewer deployment environments.

## User stories

- As a developer, I push a commit and get a pass or fail from the fast gate within 10 minutes with the failing job and log linked.
- As a documentation writer, a pull request that only changes prose does not consume the test pipeline, yet a spec YAML change still runs spec:check.
- As a maintainer, I find the nightly long-run reports as artifacts every morning.

## Edge cases

- Two pushes to the same branch arrive within a minute; the older run is cancelled by the concurrency group so only the newest finishes.
- A pull request from a fork must not receive secrets; workflows need none and use read-only permissions, with no pull_request_target usage.
- The pnpm cache misses after a lockfile change; install takes longer but still succeeds, and the cache is saved under the new key.
- A docs-only pull request is skipped, but branch protection requires the check; a lightweight always-run job named gate-summary passes when jobs were skipped by paths filter.
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

CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-141-01 | [Domain schema](domain_schema.md) | 3 |
| PS-141-02 | [Validation rules](validation_rules.md) | 3 |
| PS-141-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-141-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-141-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-141-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-141-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-141-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-141-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-141-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `.github/workflows/index.ts`.

## Acceptance criteria

- The fast gate runs install, spec:check, typecheck, unit, property, integration, a single PWA build and e2e smoke without a relay, and finishes in at most 10 min p95.
- A docs-only pull request skips the test jobs while a spec YAML change still runs spec:check.
- Only first-party actions are used and no pull request workflow has secrets or write permissions.
- The nightly workflow runs long property, load, chaos and compatibility jobs and publishes reports.
