# PS-022-06 — Failure recovery and idempotency: Cycle dropouts

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M03 Cycle dropouts](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/dropouts` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-022-06.R01** All commands are idempotent per CTR-IDM-001; a repeated withdraw returns the stored record.
- **PS-022-06.R02** A withdrawal, the phase computation, the cycle cancellation and the release of the principal's reservations happen in one IndexedDB transaction, so no state exists where the cycle is cancelled but items are still held.
- **PS-022-06.R03** Conflicting evidence, such as a handover attestation arriving after cancellation, never reopens a cycle and is escalated to recovery rather than merged.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; records are unique per (cycleId, participantId, publicReason) so a repeated notice or sweep creates nothing new.
- **concurrency:** Web Locks mutex per cycleId; expectedRevision on withdraw; phase computed inside the transaction after taking the cycle lock, and MUTINY_DROPOUT_PHASE_CONFLICT is returned if evidence changes concurrently.
- **retries:** Withdrawal statements go through the sync outbox with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per destination); the local cancellation never waits for delivery.
- **offline:** Withdraw and all timeouts work offline; the others learn through delivery or their own clocks, and the UI shows prepared until a relay receipt exists and never claims the others know.
- **partial failure:** If the withdrawal statement cannot be signed because the key is locked, the transaction aborts and nothing is cancelled; if delivery fails, the principal is already out locally and the peers' deadlines will cancel the cycle.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-022-09.T02 | integration | PS-022-01.R03, PS-022-03.R02, PS-022-06.R02 | Dan withdraws in 4-party cycle after Alice's handed_over evidence | outcome partially_executed, cycle not cancelled, recovery opened by F02.S03.M04 |
| TEST-PS-022-09.T05 | integration | PS-022-03.R04, PS-022-06.R03 | handed_over attestation arrives after cancellation | cycle stays cancelled and a standalone recovery case is opened |
| TEST-PS-022-09.T11 | integration | PS-022-06.R01, PS-022-06.R02 | replay withdraw; crash between cancellation and release | one record; no partial state; release and cancel atomic |
| TEST-PS-022-09.T12 | chaos | PS-022-06.R03, PS-022-05.R03 | relay down while withdrawing | local cancellation immediate; UI shows prepared; peers cancel by their own deadline |

## Dependencies

Module depends on: F02.S03.M01, F02.S03.M04, F02.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
