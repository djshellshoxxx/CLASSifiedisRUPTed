# PS-088-06 — Failure recovery and idempotency: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-06.R01** Sending is at least once and receivers deduplicate by cid, so a repeated batch is harmless.
- **PS-088-06.R02** Every batch carries a batchId used as the Idempotency-Key, so a retried request returns the original results.
- **PS-088-06.R03** Local commit comes first; a failed or unreachable destination never rolls back the local record.

## Specification

- **idempotency:** batchId is also the Idempotency-Key (24 h replay window at the receiver); entries are unique per (cid, destination) while active.
- **concurrency:** One dispatcher per destination (a lock inside the vault or relay process); entries are leased for 60 s while a batch is in flight and the lease expires automatically if the tab closes.
- **retries:** IDM-4 backoff within a round, then rounds at 1 min, 15 min, 1 h, 6 h and 24 h; 429 uses retryAfterMs without counting an attempt.
- **offline:** Statements commit locally and enter prepared; the outbox drains on reconnect in creation order; the UI shows Saved on this device or Queued until a receipt arrives.
- **partial failure:** A batch response lists per-envelope outcomes; accepted ones advance, buffered ones stay prepared with a 30 min recheck, rejected ones fail with the receiver's code; a batch timeout leaves all entries prepared with attempts incremented.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T09 | integration | PS-088-06.R01, PS-088-06.R02 | send the same batch twice with the same batchId; receiver replays | one set of results; no duplicate records |
| TEST-PS-088-09.T10 | chaos | PS-088-06.R03, PS-088-08.R03 | relay down for 2 h then back; kill app mid-batch | local record unchanged; entries retry with IDM-4 backoff; lease expires after 60 s; no loss |
| TEST-PS-088-09.T11 | integration | PS-088-06.R03, PS-088-03.R01 | batch of 100 with 3 rejected and 2 buffered | 95 advance, 3 failed with receiver codes, 2 stay prepared with 30 min recheck |
| TEST-PS-088-09.T12 | integration | PS-088-03.R01, PS-088-06.R03 | 6 attempts x 5 rounds exhausted | entry failed and federation.delivery.failed emitted once |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
