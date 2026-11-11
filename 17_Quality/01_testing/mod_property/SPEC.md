# F17.S01.M02 — Property testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S01](../SPEC.md). **Process IDs:** PS-136-01…PS-136-10. **Code:** `tests/property`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Property-based test suites using fast-check 4.10.2 for the invariants that example tests cannot exhaust: money arithmetic and allocation, cycle matching, state machine transitions, geohash coarsening and idempotency replay. Runs are seeded and reproducible, with at least 200 runs per property on pull requests and 10 000 runs in the nightly profile.

## Responsibilities

- Provide the property suites for money (CTR-MNY-001, F09.S03.M03), matching (F02.S02.M03), state machines (every machines[] block), geohash and geoprivacy (F06.S02.M01), idempotency (CTR-IDM-001) and signed statements (RFC 8785 JCS canonicalization, Ed25519 verification, fork detection, N2 signer roles from the F11.S01.M01 statement registry, re-delivery by cid) under tests/property.
- Define two run profiles: pr (numRuns 200, fixed base seed derived from the commit SHA, 60 s budget) and nightly (numRuns 10 000, fresh random seed, 20 min budget).
- Record the seed and the shrunk counterexample on failure as a classrup-regression/v1 case. An open case (bug not yet fixed) lives only as a CI artifact and an issue; the case is merged into tests/property/regressions/ on main only in the pull request that fixes the bug, with status fixed, and is then replayed on every later run as an expected-pass example (the property must hold for the shrunk value).
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

- A property finds a counterexample that is later fixed; the case is merged with the fix as status fixed and keeps running as an expected-pass example forever.
- Nightly finds a counterexample for a bug nobody has fixed yet; it is uploaded as an open regression artifact and filed as one issue, never committed to main, so unrelated pull requests stay green.
- A fix pull request adds a regression file; CI runs the case on the parent commit, where it must fail, and on the pull request head, where it must pass.
- A generated exact coordinate (L4) or a precision-7 cell reaches a public projection builder; the geoprivacy property fails unless the output is snap(input) at precision 5 or coarser.
- A correctly signed acceptance arrives from a key that is not the listing author; the trust property expects quarantine with reason signer_role_invalid and no state change.
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

CTR-TST-001, CTR-MNY-001, CTR-IDM-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, F17.S01.M01, F09.S03.M03, F02.S02.M03, F06.S02.M01, F15.S02.M02, F11.S01.M01, F11.S01.M03, F11.S02.M03, F16.S01.M01

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-136-01 | [Domain schema](domain_schema.md) | 5 |
| PS-136-02 | [Validation rules](validation_rules.md) | 4 |
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
- Property suites exist for money, matching, state machines, geohash and geoprivacy, idempotency, and signed statements with signer roles.
- No nightly counterexample is committed to main before its fix, and a fixed regression replays as an expected-pass example.
