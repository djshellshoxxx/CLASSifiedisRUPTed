# PS-088-06 — Failure recovery and idempotency: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-06.R01** Sending is at least once and receivers deduplicate by cid, so a repeated batch is harmless.
- **PS-088-06.R02** Every batch carries a batchId used as the Idempotency-Key and as the RFC 9421 nonce, so a retried request returns the original results and a captured request is never processed twice.
- **PS-088-06.R03** Local commit comes first; a failed or unreachable destination never rolls back the local record.

## Specification

- **idempotency:** batchId is also the Idempotency-Key (24 h replay window at the receiver) and the request nonce; PeerOutbox entries are unique per (cid, destination) while active; vault routing is idempotent per (cid, destination) in F15.S01.M01.
- **concurrency:** One dispatcher per destination (a lock inside the relay process; Web Lock in the vault through F15.S01.M01); entries are leased for 60 s while a batch is in flight and the lease expires automatically if the process or tab stops.
- **retries:** PeerOutbox: IDM-4 backoff within a round, then rounds at 1 min, 15 min, 1 h, 6 h and 24 h; 429 uses retryAfterMs without counting an attempt. Vault: F15.S01.M01 retry rules; the adapter reports retryable codes and retryAfterMs.
- **offline:** Statements commit locally and F15 entries enter prepared; the outbox drains on reconnect in creation order; the UI shows 'Saved on this device' or 'Queued' until a receipt arrives.
- **partial failure:** A batch response lists per-envelope outcomes; accepted, duplicate, hidden and quarantined advance to delivered (relay) or completed (vault public), buffered stay transport_acknowledged until expiry, rejected fail with the receiver's code; a batch timeout leaves all entries prepared with attempts incremented.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T09 | integration | PS-088-06.R01, PS-088-06.R02 | send the same batch twice with the same batchId; receiver replays | one set of results; the repeat answered from the Idempotency-Key store; no duplicate records |
| TEST-PS-088-09.T10 | chaos | PS-088-06.R03, PS-088-09.R02 | relay down for 2 h then back; kill process mid-batch | local record unchanged; entries retry with IDM-4 backoff; lease expires after 60 s; no loss |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
