# PS-084-06 — Failure recovery and idempotency: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-06.R01** Ingest and receive are idempotent per envelope by cid, and relay requests also by batchId and Idempotency-Key, so senders may retry whole batches safely.
- **PS-084-06.R02** Each envelope is committed in its own transaction so one bad envelope never rolls back its valid neighbours, and results report each outcome.
- **PS-084-06.R03** A crash between storing a record and writing its local event cannot occur because both are written in one IndexedDB or SQLite transaction (EVT-8).

## Specification

- **idempotency:** Batch replay with the same Idempotency-Key within 24 h returns the stored results array; re-sent envelopes with known cid return outcome duplicate and emit no event.
- **concurrency:** Per-author ordering is serialized by a unique partial index on (tenant, author, seq) for accepted rows and by a single read-write transaction around placement; two relays delivering the same seq race to one accepted and one quarantined row.
- **retries:** Peers retry on 429 and 5xx with CTR-IDM-001 backoff; this module never retries inbound work except the single origin fetch for a gap, which is tried once at buffer expiry.
- **offline:** Publish and tombstone commit locally first (state local committed) and are queued in the sync outbox of F11.S02.M01 with states prepared, transport_acknowledged and peer_accepted (IDM-7); the vault verifies received statements fully offline once fetched; the UI never shows a state beyond the one reached.
- **partial failure:** If the blocklist service is unavailable the batch returns DEPENDENCY_UNAVAILABLE and stores nothing (fail closed); if the chosen relay is down the statement stays local committed and delivery shows unknown; if media fetch fails the record is accepted with mediaStatus pending and retried 3 times over 1 h.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T15 | integration | PS-084-04.R01, PS-084-04.R02, PS-084-06.R02 | batch of 100 with 3 invalid envelopes | 97 accepted, 3 rejected with codes, results in request order, 97 accepted events and 3 rejected events |
| TEST-PS-084-09.T26 | integration | PS-084-06.R01, PS-084-01.R04 | publish while relay is down, then relay returns receipt, then peer acknowledgement | UI states local committed, transport_acknowledged, peer_accepted in order and never more than reached |
| TEST-PS-084-09.T18 | integration | PS-084-05.R02, PS-084-06.R01 | local publish with own key, then with another principal's did; relay ingest batch replayed with the same Idempotency-Key | first accepted, second FEDERATION_AUTHOR_NOT_OWNED, replay returns original response |
| TEST-PS-084-09.T19 | chaos | PS-084-06.R02, PS-084-06.R03 | kill relay mid-batch; blocklist service down; media fetch fails | restart leaves each envelope committed or absent; DEPENDENCY_UNAVAILABLE stores nothing; record accepted with mediaStatus pending |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
