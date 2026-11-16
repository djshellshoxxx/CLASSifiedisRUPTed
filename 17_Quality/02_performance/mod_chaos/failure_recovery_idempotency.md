# PS-138-06 — Failure recovery and idempotency: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-06.R01** Idempotency is verified under each fault: replaying a command whose response was lost returns the stored result with no duplicate effect (CTR-IDM-001).
- **PS-138-06.R02** Consumers dedupe by event ID, so duplicate or reordered deliveries are safe (CTR-EVT-001).
- **PS-138-06.R03** After any single injected fault, a sweep of the relay with nothing else running shows zero orphan holds, zero stuck sagas and zero undelivered outbox events.

## Specification

- **idempotency:** Scenarios are re-runnable from the seed; the relay under test is rebuilt per scenario so earlier faults leave no residue.
- **concurrency:** Scenarios run sequentially per relay but in parallel across workers; fault schedules use a seeded PRNG so concurrency interleavings are reproducible.
- **retries:** No retries of failed scenarios; the system's retry behavior (busy timeout 5 000 ms, exponential backoff 1 s to 60 s with jitter) is what is under test.
- **offline:** Peer outage and network faults are simulated by fake transports; no real network is used.
- **partial failure:** The runner continues remaining scenarios after one fails, writes all results, and exits with the worst code.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T03 | chaos | PS-138-02.R01, PS-138-06.R01 | db_busy: SQLITE_BUSY for 12 s during accept commands | commands retried or DEPENDENCY_UNAVAILABLE; no half-commit; exactly-once after replay |
| TEST-PS-138-09.T04 | chaos | PS-138-03.R01, PS-138-03.R02, PS-138-06.R03 | consumer_crash: crash before and after ack on a cycle execution | no duplicate effect; orphan holds zero; recovery within 60 s |
| TEST-PS-138-09.T07 | chaos | PS-138-06.R02, PS-138-09.R03 | clock_skew: minus 24 h then plus 24 h with planted wall-clock expiry bug | bug detected; correct implementation keeps expiries and revisions monotonic |
| TEST-PS-138-09.T15 | chaos | PS-138-06.R01 | combined_busy_crash: busy writes while consumer crashes | invariants hold and outbox drained |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
