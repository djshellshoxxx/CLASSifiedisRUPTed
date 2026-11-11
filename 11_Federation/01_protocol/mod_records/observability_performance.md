# PS-084-08 — Observability and performance: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-08.R01** On relays, every ingest outcome is counted; the PWA sends no telemetry (OBS-7) and keeps the same counters in local diagnostics that the user may export.
- **PS-084-08.R02** Every ingest outcome is counted by outcome and code, and purge timeliness is measured against the 24 h tombstone deadline.
- **PS-084-08.R03** A batch of 100 envelopes is processed with p95 ≤ 800 ms at 10 batches per second on the reference relay.
- **PS-084-08.R04** Alerts fire when purge lag exceeds 1 h, when buffered records exceed 5000, or when a peer's rejection ratio exceeds 20 percent over 15 minutes.

## Specification

**Metrics**
- classrup_federation_records_total{outcome=accepted|duplicate|buffered|held|hidden|quarantined|rejected, code}
- classrup_federation_tombstones_total{outcome=applied|pending|advisory|rejected}
- classrup_federation_purge_lag_ms (gauge: now - oldest unpurged tombstoned item)
- classrup_federation_buffered_records (gauge)
- classrup_federation_quarantined_records (gauge)
- classrup_federation_inbox_batch_duration_ms (histogram)

**Logs**
- info federation.record.accepted {recordId, cidPrefix, sourceKind, peerId, correlationId} — no payload; never author or type for participants rows.
- warn federation.record.rejected {cidPrefix, sourceKind, peerId, code, internalReason, correlationId} — no payload, author or signature.

**Budgets**
- Inbox batch of 100 envelopes p95 ≤ 800 ms; single local publish p95 ≤ 300 ms including seq allocation.
- Mirror read queries p95 ≤ 150 ms for ≤ 50 items.
- Purge sweep removes 10 000 tombstoned mirrors in ≤ 10 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T21 | load | PS-084-08.R01, PS-084-08.R02, PS-084-08.R03 | 10 batches/s of 100 envelopes for 5 minutes | batch p95 ≤ 800 ms, metrics exported |
| TEST-PS-084-09.T22 | integration | PS-084-08.R04, PS-084-03.R03 | 10 000 tombstoned mirrors and delayed purge | sweep ≤ 10 s; purge_lag alert fires when lag exceeds 1 h |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F16.S01.M01, F15.S02.M01, F15.S04.M02, F15.S04.M03, F12.S02.M02, F12.S03.M03, F12.S03.M04, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
