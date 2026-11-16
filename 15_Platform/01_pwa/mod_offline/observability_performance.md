# PS-116-08 — Observability and performance: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-08.R01** The PWA sends no telemetry; outbox and storage diagnostics stay in the vault, are shown in the Storage status panel and can be exported by the user (CTR-OBS-001 OBS-7).
- **PS-116-08.R02** Enqueue completes fast enough to feel instant on a Moto G-class device (CTR-OBS-001 OBS-5).
- **PS-116-08.R03** Delivery of 200 entries never blocks the main thread for more than 50 ms per task.

## Specification

**Metrics**
- local counters in meta (never transmitted): outbox_delivery_total{outcome=transport_acknowledged|completed|retry|conflict|failed|expired}
- local gauge outbox_pending_count and storage usageRatio, shown in the Storage status panel
- local histogram outbox_age_ms (createdAt to terminal state), last 500 samples

**Logs**
- Local diagnostic log in IndexedDB store diag (ring buffer, 500 lines): outbox.delivery {entryIdHash, state, attempts, code} — never payload or identifiers; exportable by the user, never uploaded.

**Budgets**
- enqueue p95 ≤ 30 ms from call to committed IndexedDB transaction on a Moto G-class device.
- Outbox module adds ≤ 5 KiB gzip to the initial bundle and ≤ 20 KiB gzip to the deferred chunk; initial JS stays within 150 KiB gzip (OBS-5).
- Delivering 200 queued entries takes ≤ 200 x relay write p95 (300 ms) = 60 s sequentially and never blocks the main thread longer than 50 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T15 | a11y | PS-116-08.R01 | outbox sheet, conflict dialog and storage panel scanned with axe | zero serious or critical issues; aria-live announces state changes; targets ≥ 44 px |
| TEST-PS-116-09.T17 | load | PS-116-08.R02, PS-116-08.R03 | enqueue 200 entries then deliver against stub with 300 ms latency | enqueue p95 ≤ 30 ms, longest main-thread task ≤ 50 ms, total ≤ 60 s |
| TEST-PS-116-09.T21 | integration | PS-116-01.R02, PS-116-08.R01 | storage status with persist() denied, usage 85 percent, last export 31 days ago, and a missing storageMarker | evictionRisk true, exportOverdue true, data-loss warning shown with restore action, no entries fabricated |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
