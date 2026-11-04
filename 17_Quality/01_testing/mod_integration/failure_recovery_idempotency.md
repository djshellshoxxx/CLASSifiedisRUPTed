# PS-135-06 — Failure recovery and idempotency: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-06.R01** Idempotency is tested in every flow by replaying the first mutating command with the same key and asserting identical response and no new events.
- **PS-135-06.R02** Concurrent steps use deterministic scheduling (explicit awaits on a controlled executor) so the same interleaving runs on every execution.
- **PS-135-06.R03** After a simulated consumer crash, redelivery produces a single net effect (CTR-EVT-001 at-least-once with idempotent consumers).
- **PS-135-06.R04** After a relay outage or tampering, each vault's sync outbox states move only along local committed, prepared, transport_acknowledged, peer_accepted (CTR-IDM-001 IDM-7) and the harness asserts the UI-facing status never exceeds the state reached.

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
| TEST-PS-135-09.T19 | integration | PS-135-02.R04, PS-135-06.R04 | run all flows with --mode relay and --mode direct | same final vault state in both modes except declared relay-only flows; QUALITY_IT_MODE_DIVERGENCE otherwise |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, F17.S01.M01, F15.S02.M02, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
