# F17.S01.M02 — Property testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-136-01…PS-136-10. **Code:** `tests/property`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Property-based test suites using fast-check 4.10.2 for the invariants that example tests cannot exhaust: money arithmetic and allocation, cycle matching, state machine transitions, geohash coarsening and idempotency replay. Runs are seeded and reproducible, with at least 200 runs per property on pull requests and 10 000 runs in the nightly profile.

## Responsibilities

- Provide the property suites for money (CTR-MNY-001), matching (F02.S02), state machines (every machines[] block), geohash (F04), idempotency (CTR-IDM-001) and signed statements (RFC 8785 JCS canonicalization, Ed25519 verification, fork detection) under tests/property.
- Define two run profiles: pr (numRuns 200, fixed base seed derived from the commit SHA, 60 s budget) and nightly (numRuns 10 000, fresh random seed, 20 min budget).
- Record the seed and the shrunk counterexample path on failure and persist it as a regression case that is replayed on every later run.
- Provide shared arbitraries (Money, ActorId, Listing, Edge graph, Command sequence) so suites stay consistent with production schemas.

## Not responsible for

- Example-based unit tests (F17.S01.M01).
- Load and fault injection (F17.S02.M01 and F17.S02.M02).
- Defining the invariants themselves; each owning module states them in its spec and this module encodes them.
- Future: model-based testing of the full relay with stateful fast-check commands.

## User stories

- As a developer, I get the failing seed and a minimal counterexample when a property fails so I can replay it locally with one command.
- As a maintainer, I see the nightly 10 000-run profile report any new counterexample as an issue within 24 h.
- As a reviewer, I can see which invariant from which module spec a property encodes by its TEST ID.

## Edge cases

- A property finds a counterexample that is later fixed; the stored regression case keeps running as an example forever.
- Arbitrary generation produces a degenerate value (empty graph, zero amount); generators include them deliberately and properties handle them or assert the documented error.
- A property exceeds the per-property 10 s timeout on a pathological graph; the run fails with QUALITY_PROP_TIMEOUT and the seed instead of hanging CI.
- The same seed on a different Node patch version yields different values; the seed is paired with the fast-check version in the report and the lockfile pins 4.10.2.
- Floating point creeps into money tests; the arbitrary only produces integer minor-unit strings and a property asserts no number type crosses the Money boundary.
- Nightly run and PR run disagree on a flaky property; the failing seed is saved and re-run under both profiles before triage.

## UX and accessibility



Headless. Reports are fast-check verbose output plus reports/property.json containing seed, numRuns, path and counterexample per failed property.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, F17.S01.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-136-01 | [Domain schema](domain_schema.md) | 4 |
| PS-136-02 | [Validation rules](validation_rules.md) | 3 |
| PS-136-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-136-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-136-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-136-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-136-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-136-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-136-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-136-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/property/index.ts`.

## Acceptance criteria

- Every property runs at least 200 times on pull requests and exactly 10 000 times nightly, with the seed printed on failure.
- A planted off-by-one money split is detected within 200 runs and reported with a minimal counterexample.
- Replaying a recorded seed and path reproduces the failure deterministically.
- Property suites exist for money, matching, state machines, geohash and idempotency.
