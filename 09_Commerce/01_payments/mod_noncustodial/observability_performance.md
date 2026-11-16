# PS-069-08 — Observability and performance: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-08.R01** The PWA sends no telemetry (OBS-7); counters and error logs stay in local diagnostics that the user can export.
- **PS-069-08.R02** Local command latency meets the budgets below on a mid-range phone.
- **PS-069-08.R03** Quarantine and fork counts are visible to the user in local diagnostics.

## Specification

**Metrics**
- Local diagnostics: classrup_commerce_deals_total{outcome=opened|completed|cancelled|expired}
- Local diagnostics: classrup_commerce_claims_total{method,status}
- Local diagnostics: classrup_commerce_statements_total{outcome=applied|quarantined|duplicate|fork}

**Logs**
- info claim.acknowledged {claimId, dealId, correlationId} — no amounts, notes or txRef.
- warn statement.quarantined {cid, reason, correlationId}.

**Budgets**
- open, claim, acknowledge p95 ≤ 120 ms local commit on a 2022 mid-range Android device.
- Ingest of a statement batch of 100 ≤ 2 s including signature verification (Ed25519 verify ≤ 5 ms each).
- Expiry sweep over 10 000 claims ≤ 1 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T15 | load | PS-069-08.R02, PS-069-08.R03 | 10 000 claims and a batch of 100 statements | p95 ≤ 120 ms commit; batch ≤ 2 s; sweep ≤ 1 s |
| TEST-PS-069-09.T16 | integration | PS-069-08.R01, PS-069-09.R01 | local diagnostics and traceability run | no network telemetry sent; every PS-069 requirement maps to a passing test |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
