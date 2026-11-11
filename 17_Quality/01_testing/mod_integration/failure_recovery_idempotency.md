# PS-135-06 — Failure recovery and idempotency: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-06.R01** Idempotency is tested in every flow by replaying the first mutating command with the same key and asserting identical response and no new events.
- **PS-135-06.R02** Concurrent steps use deterministic scheduling (explicit awaits on a controlled executor) so the same interleaving runs on every execution.
- **PS-135-06.R03** After a simulated consumer crash, redelivery produces a single net effect (CTR-EVT-001 at-least-once with idempotent consumers).
- **PS-135-06.R04** After a relay outage or tampering, each domain record is local committed and its OutboxEntry moves only along the F15.S01.M01 states prepared, sending, transport_acknowledged, peer_accepted (or conflict, failed, expired) per CTR-IDM-001 IDM-7, and the harness asserts after every step that the UI-facing label never exceeds the state reached.

## Specification

- **idempotency:** The harness re-runs any flow in a fresh database, so flows are repeatable; the first mutating command of each flow is replayed to prove idempotency (CTR-IDM-001).
- **concurrency:** Flows run in parallel across test files, each with its own database and tenant; within a flow, concurrency is simulated with a deterministic scheduler.
- **retries:** No retries on assertion failures. The fake ChainVerifierPort supports scripted RPC failures so retry logic of the system under test is exercised, not the test itself.
- **offline:** Everything runs offline by construction; flows needing the network use fake ports.
- **partial failure:** A failed step stops its flow and dumps the event trail, state snapshot and seed to reports/integration.json; other flows still run and the exit code is the worst code seen.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T07 | integration | PS-135-04.R03, PS-135-06.R03 | run with scripted consumer crash and redelivery | single net effect and outbox drained |
| TEST-PS-135-09.T10 | integration | PS-135-06.R01 | replay first mutating command in each flow | identical response and zero new events |
| TEST-PS-135-09.T11 | integration | PS-135-06.R02 | two concurrent offer acceptances with the deterministic scheduler | same interleaving every run; exactly one accepted |
| TEST-PS-135-09.T20 | integration | PS-135-02.R04, PS-135-06.R04 | relay_down - stop relay between prepared and transport_acknowledged | local records intact; OutboxEntry stays prepared (Saved on this device); completes via direct exchange; after every step no vault label exceeds the reached state (no Reached relay before a verified receipt, no Confirmed by peer before peer_accepted) |
| TEST-PS-135-09.T27 | abuse | PS-135-02.R04, PS-135-06.R04 | relay_withhold_equivocate - the relay serves vaults Bob and Carol different index views of one author chain, withholds seq 4 and drops an author tombstone | the gap is detected and released with chainGap after 24 h of FakeClock; the tombstone is applied once fetched from the author; no vault shows more than its reached sync state |
| TEST-PS-135-09.T28 | abuse | PS-135-02.R06, PS-135-06.R04 | overclaim lint - a flow report fixture using verified and paid as state names, and a vault label planted as Confirmed by peer while the entry is transport_acknowledged | each fails with QUALITY_IT_OVERCLAIM |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
