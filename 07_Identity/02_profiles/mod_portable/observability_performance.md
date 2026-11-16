# PS-055-08 — Observability and performance: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-08.R01** Relays export publication and read metrics per CTR-OBS-001; vaults keep local diagnostics only.
- **PS-055-08.R02** Signature verification and storage of a document take at most 10 ms p95 on a Moto G-class device and 5 ms on the relay.
- **PS-055-08.R03** Relay reads meet the read budget of p95 at most 150 ms.

## Specification

**Metrics**
- classrup_identity_doc_publications_total{outcome=ok|invalid|chain|rate_limited} (relay)
- classrup_identity_doc_contested_total (relay)
- local counter portable_doc_total{event=issued|received|contested}

**Logs**
- info portable_doc.stored {outcome, correlationId} - no DID, keys or relay URLs.

**Budgets**
- verify and store p95 <= 10 ms on device and <= 5 ms on relay; relay read p95 <= 150 ms; issue p95 <= 100 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T12 | load | PS-055-08.R01, PS-055-08.R02, PS-055-08.R03 | 1 000 verifications on emulated Moto G and 50 reads per second on relay | <= 10 ms device, <= 5 ms relay, read p95 <= 150 ms |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
