# PS-091-06 — Failure recovery and idempotency: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-091-06.R02** Quota counters are updated in the same transaction as the acceptance they count, so a crash cannot grant free capacity.
- **PS-091-06.R03** If peer data cannot be read, requests fail closed with DEPENDENCY_UNAVAILABLE rather than accepting traffic.

## Specification

- **idempotency:** Idempotency-Key on every command (24 h replay); propose with the same baseUrl and key returns the existing proposed Peer.
- **concurrency:** expectedRevision on state changes; unique index on (tenant, relayId); health score updates use atomic increments clamped to 0..100; simultaneous proposals merge.
- **retries:** Fetching the peer identity statement retries 3 times with backoff 1 s, 5 s, 30 s; other commands are local and not retried.
- **offline:** A vault can edit its relay list offline; activation needs a live identity fetch so it stays proposed until the relay answers.
- **partial failure:** If the identity fetch succeeds but the proposal statement cannot be delivered, the Peer stays proposed and the UI offers retry; no half-active peer exists.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T06 | integration | PS-091-03.R01, PS-091-06.R02 | proposal not accepted for 14 days | status expired by sweep |
| TEST-PS-091-09.T10 | integration | PS-091-06.R01, PS-091-06.R03 | replay propose and accept with same Idempotency-Key; identity fetch ok but delivery fails | original responses replayed; Peer remains proposed |
| TEST-PS-091-09.T11 | chaos | PS-091-06.R02, PS-091-06.R03 | kill process between quota counter update and record acceptance; peer store unavailable | counter and acceptance commit together; DEPENDENCY_UNAVAILABLE fail closed |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
