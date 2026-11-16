# PS-093-08 — Observability and performance: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-08.R01** Relay capture, verify and read durations and outcomes are measured per CTR-OBS-001 without content in logs, and the vault keeps only local diagnostics (OBS-7).
- **PS-093-08.R02** Capture meets p95 ≤ 300 ms on a relay and ≤ 150 ms in a vault for bodies up to 256 KiB, with media copied asynchronously within 30 s.
- **PS-093-08.R03** Integrity failures and unusual access volume are alerting metrics on the relay and local notices in the vault.

## Specification

**Metrics**
- classrup_moderation_evidence_captures_total{outcome=ok|too_large|signature_invalid|missing} (relay)
- classrup_moderation_evidence_integrity_failures_total (relay)
- classrup_moderation_evidence_reads_total{purpose} (relay)
- classrup_moderation_evidence_bytes (relay gauge per tenant)

**Logs**
- relay info evidence.captured {snapshotId, targetType, bytes, correlationId} — no content.
- relay error evidence.integrity_failed {snapshotId, correlationId}; vault writes the same to local diagnostics.

**Budgets**
- relay capture p95 ≤ 300 ms and vault capture p95 ≤ 150 ms for ≤ 256 KiB; read p95 ≤ 150 ms; verify of one snapshot ≤ 50 ms.
- Sweep verifies 10 000 snapshots in ≤ 120 s on a relay.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T12 | load | PS-093-08.R01, PS-093-08.R02, PS-093-08.R03 | 50 captures per second for 5 minutes on a relay with 256 KiB bodies; vault capture on Moto G profile | relay p95 ≤ 300 ms, vault p95 ≤ 150 ms, metrics exported, sweep of 10 000 snapshots ≤ 120 s |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
