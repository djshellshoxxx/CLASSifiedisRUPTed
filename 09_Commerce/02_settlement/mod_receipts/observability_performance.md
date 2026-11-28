# PS-071-08 — Observability and performance: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-08.R01** The PWA sends no telemetry (OBS-7); signing and verification timings stay in local diagnostics.
- **PS-071-08.R02** Signing and verification meet the stated budgets on a mid-range phone.
- **PS-071-08.R03** Quarantine counts are visible in local diagnostics.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_receipts_total{outcome=issued|ingested|quarantined|invalid|dropped}
- Local diagnostics: classrup_commerce_receipt_quarantine_total{reason}
- Local diagnostics: classrup_commerce_receipt_verify_ms (histogram)

**Logs**
- info receipt.issued {receiptId, claimId, statementType, correlationId} — no text, no amounts.

**Budgets**
- issue p95 ≤ 80 ms including Ed25519 signing; verify p95 ≤ 25 ms including the device-link chain check.
- Exported receipt file ≤ 8 KiB including the device-link chain.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T13 | load | PS-071-08.R01, PS-071-08.R02, PS-071-08.R03 | 1 000 signs and 1 000 verifies | p95 sign ≤ 80 ms, verify ≤ 25 ms, no telemetry sent, quarantine counts by reason visible in local diagnostics |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
