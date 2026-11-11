# F17.S01.M01 — Unit testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-137-01…PS-137-10. **Code:** `tests/unit-conventions`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Defines how unit tests are written and enforced in the pnpm workspace: one vitest 5.1.0 configuration (vitest.config.ts with test.projects) shared by all packages, deterministic fixtures with an injected clock and ID generator, the TEST-PS-NNN-PP.Tnn title convention (CTR-TST-001) and coverage thresholds that fail the build when core packages drop below 85 % line coverage. It is the base layer; property, integration and e2e suites live in sibling modules.

## Responsibilities

- Provide the shared vitest 5.1.0 configuration used by every package as vitest.config.ts with test.projects (vitest 5.1.0 has no workspace file and no defineWorkspace export): one project per environment, node and browser-like with fake-indexeddb, each with pool: forks, isolate: true, testTimeout: 5000, no network and parallel workers = CPU count.
- Enforce coverage thresholds: core packages (kernel, money, matching, mutiny, commerce, security) at least 85 % lines, 85 % functions, 80 % branches; other packages at least 70 % lines.
- Provide deterministic fixtures: FakeClock, SeqIdGenerator (UUIDv7-shaped, monotonic), seeded PRNG, factory builders for Listing, Offer, Proposal, Money and actors.
- Ban nondeterminism in unit scope: Math.random, Date.now, new Date() without arguments and global fetch throw inside tests unless a fixture is injected.
- Run isomorphic packages (kernel core, money, matching, mutiny, commerce) in two environments, Node 22 and a browser-like one (fake-indexeddb, WebCrypto, no node: modules), and provide MemoryVault, seeded Ed25519 key factories and signed-statement builders so vault logic is unit-tested without a relay.

## Not responsible for

- Randomised and generative testing (F17.S01.M02 property).
- Relay plus SQLite flows (F17.S01.M03 integration) and browser tests (F17.S01.M04 e2e).
- Mapping requirements to tests and failing releases on gaps (F17.S03.M02 gates; the tools/trace tool reads the titles this module standardises).
- Future: mutation testing with Stryker as a nightly report.
- Flake detection over CI history and the quarantine waiver verdict at release (F17.S03.M01 nightly report job and F17.S03.M02 gates); this module owns the tests/quarantine.yaml format and the runner behavior.

## User stories

- As a developer, I run pnpm test:unit and get a result in under 60 s on a 2 vCPU machine with the exact failing seed or fixture time printed on failure.
- As a reviewer, I see a coverage delta per package and the build fails if a core package falls below 85 % lines.
- As a QA lead, I can find any requirement's test by grepping its TEST-PS-NNN-PP.Tnn ID.

## Edge cases

- A test title without a valid TEST-PS-NNN-PP.Tnn prefix in a spec-covered package is rejected by the lint rule with QUALITY_UNIT_TITLE_INVALID.
- A test calls Date.now directly; the setup file throws QUALITY_UNIT_NONDETERMINISTIC naming the file and line.
- Coverage of a new package is 0 % because it has no tests yet; the check treats missing packages as below threshold, not as skipped.
- Two tests share a module-level mutable fixture; vitest isolate mode is on, so state never leaks and a lint rule forbids top-level let in test files.
- A flaky test passes on retry; retries are set to 0 locally and 0 in CI so flakes surface as failures, and a test that failed in 1 of the last 100 CI runs gets a tests/quarantine.yaml entry within 24 h.
- A quarantine entry passes its expiresAt (at most 14 days); the test returns to the blocking project and the release gate treats the expired entry as an expired waiver.
- A synthetic exact coordinate (L4) marked P3 is fed to a public projection builder; the output holds only snap(input) at precision 5 or coarser and the canary coordinates never appear.
- Windows line endings or locale change numeric formatting; fixtures use fixed locale en-US and TZ=UTC set in the global setup.

## UX and accessibility



Headless. Output is the vitest reporter (default locally, junit and json in CI) and an LCOV file; failure messages name the TEST ID, the seed and the file. No end-user screens.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-ID-001, CTR-MNY-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F15.S02.M03, F15.S02.M02, F16.S01.M01, F16.S02.M01, F11.S01.M03, F09.S03.M03, F06.S02.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-137-01 | [Domain schema](domain_schema.md) | 4 |
| PS-137-02 | [Validation rules](validation_rules.md) | 4 |
| PS-137-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-137-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-137-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-137-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-137-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-137-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-137-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-137-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/unit-conventions/index.ts`.

## Acceptance criteria

- pnpm test:unit finishes under 60 s on the 2 vCPU reference runner with zero failures.
- Every core package reports at least 85 % line coverage and a lowered threshold cannot merge without a code-owner approval.
- A deliberately introduced Date.now call in a test is rejected with QUALITY_UNIT_NONDETERMINISTIC.
- Every test title in covered packages carries a valid TEST-PS-NNN-PP.Tnn ID.
- A test is taken out of the blocking run only through an unexpired tests/quarantine.yaml entry, and an expired entry fails the release gate.
