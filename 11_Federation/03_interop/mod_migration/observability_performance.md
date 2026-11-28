# PS-090-08 — Observability and performance: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-08.R01** Moves, vetoes and failures are counted on relays and shown in local diagnostics in the vault; the PWA sends no telemetry.
- **PS-090-08.R02** Redirect lookup meets read budget p95 ≤ 150 ms.
- **PS-090-08.R03** Alerts fire on a relay when more than 5 vetoes occur in 24 h or when a copy step stays incomplete for 24 h.

## Specification

**Metrics**
- classrup_federation_migrations_total{outcome=announced|effective|cancelled|vetoed|closed|held}
- classrup_federation_migration_copy_failed_total
- classrup_federation_redirect_lookups_total{result=moved|none}

**Logs**
- info federation.migration.effective {migrationId, subjectPrefix(16), correlationId} — no relay credentials.

**Budgets**
- redirect lookup p95 ≤ 150 ms; announce p95 ≤ 300 ms excluding delivery.
- Copy step throughput ≥ 100 envelopes per batch within the delivery budget of F11.S02.M01.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T15 | load | PS-090-08.R01, PS-090-08.R02, PS-090-08.R03 | 60 redirect lookups per minute and 1000 observed moves | p95 ≤ 150 ms, rate limit enforced, metrics exported, veto alert above 5 in 24 h |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
