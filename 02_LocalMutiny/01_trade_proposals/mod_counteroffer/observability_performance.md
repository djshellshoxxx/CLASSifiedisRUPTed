# PS-012-08 — Observability and performance: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-08.R01** Local diagnostics record create and ingest outcomes with codes but without DIDs, values or snapshots (OBS-1 style, no telemetry per OBS-7).
- **PS-012-08.R02** Revision creation including hashing and signing completes within 50 ms at p95 for 8 legs on a mid-range phone.
- **PS-012-08.R03** Relays that carry revision envelopes expose only counts and sizes of ciphertext.

## Specification

**Metrics**
- classrup_mutiny_revisions_total{outcome=created|ingested|quarantined|forked} (local diagnostics)
- classrup_mutiny_revision_envelope_bytes (histogram, relay mailbox, ciphertext size only)

**Logs**
- info revision.created {revisionNo, reason, correlationId} — no DIDs, no values.
- warn revision.quarantined {code, correlationId}

**Budgets**
- create p95 ≤ 50 ms; ingest verification p95 ≤ 30 ms; diff of two revisions ≤ 20 ms.
- Snapshot ≤ 64 KiB; envelope after JCS and encryption ≤ 96 KiB.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T12 | load | PS-012-08.R02, PS-012-08.R03 | 8-leg revision create and ingest on emulated Moto G | p95 within budgets, snapshot under 64 KiB |
| TEST-PS-012-09.T13 | unit | PS-012-08.R01 | diagnostics sink | codes recorded, no DIDs or values, nothing transmitted |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
