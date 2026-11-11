# F17.S02.M01 — Load testing

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S02](../SPEC.md). **Process IDs:** PS-139-01…PS-139-10. **Code:** `tests/load`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A Node load-test script that drives a relay (2 vCPU / 4 GB reference profile, SQLite WAL) with read, write, search and cycle-matching traffic and compares measured latencies with the budgets of CTR-OBS-001 OBS-4. It writes a JSON and Markdown report and exits non-zero when any budget is exceeded. The release workflow runs the smoke and then the standard profile on the release commit because budgets are release-gated (F17.S03.M01), the nightly workflow runs standard and a weekly workflow runs soak. Per ADR-0016 and CTR-OBS-001 OBS-7 the budgets of OBS-4 apply to relays only (index, mailbox, matching over public projections, content-free push, auction host); vault performance is covered by unit and e2e budgets.

## Responsibilities

- Implement the load driver (Node 22, undici keep-alive, open-loop arrival rate) with profiles smoke (30 s), standard (5 min) and soak (60 min).
- Measure p50/p95/p99 latency and error rate per scenario: read 50 req/s p95 at most 150 ms; writes (signed projection index writes with signature verification, mailbox put of opaque envelopes, auction bids at a host relay) 50 req/s p95 at most 300 ms; search over 100 000 listings p95 at most 200 ms; cycle search on a graph of 5 000 edges with max length 5 p95 at most 250 ms.
- Seed datasets deterministically from a fixed seed the way real relays receive data: 10 000 generated did:key principals sign 100 000 classrup.bazaar.listing/v1 public projections and the public want and have projections that yield 5 000 matching edges, submitted through the relay index-write command federation.record.ingest (F11.S01.M02) with signature verification on every write; listings are vault-authored signed projections and no bulk path bypasses verification.
- Emit reports/load.json and reports/load.md and fail the run on any budget violation or error rate above 0.1 %.

## Not responsible for

- Fault injection (F17.S02.M02).
- PWA runtime budgets in a browser (F17.S01.M04 and F17.S03.M02 gates read the report).
- Capacity planning for multi-relay deployments.
- Future: distributed load generation and production shadow traffic.

## User stories

- As a release manager, I get a pass or fail verdict for the OBS-4 budgets with the p95 numbers for every scenario.
- As a developer, I run the smoke profile locally and see which endpoint regressed.
- As an operator, I compare nightly reports over 30 days to spot slow degradation.

## Edge cases

- The generator itself saturates the machine; the report records generator CPU and marks the run invalid if generator CPU exceeds 70 %.
- The relay returns RATE_LIMITED during the test; rate limits stay on, the load tenant's limits were raised by the setup step through an F12.S03.M03 RatePolicy whose revision and values are in the report, and any 429 counts as an error.
- The seeded dataset is stale after a schema change; the seed script version-checks and rebuilds, failing with QUALITY_LOAD_SEED_STALE.
- Latency spikes from a one-off garbage collection; the report uses p95 over the whole window and also flags max over 2 s.
- Coordinated omission would hide stalls; the driver is open loop and measures from intended send time.
- Database file on slow disk inflates results; the run records disk type and rejects runs on non-reference hardware unless --allow-unreferenced is passed.

## UX and accessibility



Headless. Output is a Markdown table per scenario (target, measured p50/p95/p99, error rate, verdict) and JSON for the gates module.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, F17.S01.M01, F15.S02.M01, F15.S02.M03, F12.S03.M03, F11.S01.M02, F08.S01.M01, F04.S01.M02, F07.S01.M02

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-139-01 | [Domain schema](domain_schema.md) | 3 |
| PS-139-02 | [Validation rules](validation_rules.md) | 4 |
| PS-139-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-139-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-139-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-139-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-139-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-139-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-139-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-139-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tests/load/index.ts`.

## Acceptance criteria

- On the 2 vCPU reference runner all OBS-4 budgets pass at 50 req/s for read, write_index, write_mailbox, auction_bid, search and cycle scenarios.
- A planted 400 ms slowdown is detected as a budget failure with exit 1.
- The load script refuses to run against any non-allow-listed host.
- Reports are machine-readable and consumed by the release gates.
