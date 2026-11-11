# PS-088-08 — Observability and performance: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-08.R01** On relays, queue depth, age, outcome and latency per destination are exported as metrics; the PWA sends no telemetry and shows the same numbers in local diagnostics.
- **PS-088-08.R02** Dispatching a batch of 100 envelopes costs p95 ≤ 500 ms of local work excluding network time.
- **PS-088-08.R03** Alerts fire when the oldest prepared entry is older than 15 min or the failure ratio per peer exceeds 20 percent over 15 minutes.

## Specification

**Metrics**
- classrup_federation_outbox_entries{state}
- classrup_federation_delivery_total{outcome=receipt|delivered|peer_accepted|failed|retry}
- classrup_federation_outbox_oldest_age_ms (gauge)
- classrup_federation_delivery_duration_ms (histogram)

**Logs**
- info federation.delivery.receipt {entryId, cidPrefix, destinationId, correlationId} — no payloads or user identifiers.

**Budgets**
- Batch build and sign p95 ≤ 500 ms for 100 envelopes.
- Enqueue p95 ≤ 50 ms; list p95 ≤ 150 ms for ≤ 50 items.
- Pull of 100 envelopes p95 ≤ 400 ms server time.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T15 | load | PS-088-08.R01, PS-088-08.R02 | 10 000 entries dispatched in batches of 100 across 5 destinations | batch build p95 ≤ 500 ms, metrics exported |
| TEST-PS-088-09.T22 | integration | PS-088-08.R03 | oldest prepared PeerOutbox entry reaches 15 min 1 s; one peer fails 21 percent of deliveries over 15 minutes | both alerts fire |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
