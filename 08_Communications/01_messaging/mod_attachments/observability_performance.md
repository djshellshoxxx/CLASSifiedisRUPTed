# PS-059-08 — Observability and performance: Message attachments

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M03 Message attachments](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/attachments` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-059-08.R01** Relay upload outcomes, bytes and sweep lag are measured per CTR-OBS-001; the PWA keeps local diagnostics only (OBS-7).
- **PS-059-08.R02** A 5 MiB upload completes within 20 s on a 2 Mbit/s link and server handling of each 64 KiB chunk stays under budget.
- **PS-059-08.R03** Sweeps keep storage within quota and their lag is observable.

## Specification

**Metrics**
- classrup_comms_attachments_total{outcome=uploaded|deleted|expired|rejected} (relay)
- classrup_comms_attachment_bytes_total (relay)
- classrup_comms_attachment_orphan_blobs_total (relay)
- classrup_comms_attachment_sweep_lag_ms (gauge, relay)

**Logs**
- relay info attachment.uploaded {attachmentId, cipherSize, correlationId} — no filenames, no thread data, no media content.

**Budgets**
- put_chunk p95 ≤ 100 ms; finalize p95 ≤ 300 ms including hash of 5 MiB; download first byte p95 ≤ 200 ms.
- Relay storage overhead ≤ 2 percent over ciphertext size.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-059-09.T12 | load | PS-059-08.R01, PS-059-08.R02, PS-059-08.R03 | 20 concurrent 5 MiB uploads over simulated 2 Mbit/s links | each completes within 20 s, p95 budgets met, sweep lag recovers |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F15.S02.M03, F10.S02.M03, F11.S02.M01, F15.S01.M01, F16.S02.M03, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
