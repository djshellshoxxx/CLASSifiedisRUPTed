# PS-086-08 — Observability and performance: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-08.R01** Open conflicts, age and resolution decisions are measured on relays and kept as local diagnostics in the vault.
- **PS-086-08.R02** Detect and resolve meet write budget p95 ≤ 300 ms.
- **PS-086-08.R03** An alert fires on a relay when any public_projection conflict is open longer than 8 days or more than 50 are open.

## Specification

**Metrics**
- classrup_federation_conflicts_total{outcome=detected|resolved|auto_resolved|superseded}
- classrup_federation_conflicts_open (gauge)
- classrup_federation_conflict_age_ms (gauge: oldest open)

**Logs**
- warn federation.conflict.detected {conflictId, kind, authorPrefix(16), correlationId} — no payload.

**Budgets**
- detect and resolve p95 ≤ 300 ms; list p95 ≤ 150 ms for ≤ 50 items.
- Auto-resolution sweep of 1000 expired conflicts ≤ 5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T12 | chaos | PS-086-06.R03, PS-086-08.R03 | kill process between conflict write and event; consumer unavailable for 90 s | freeze event delivered after restart; UI warning shown above 60 s lag |
| TEST-PS-086-09.T14 | load | PS-086-08.R01, PS-086-08.R02 | 1000 conflicts detected and resolved in a minute | p95 ≤ 300 ms and gauges exported |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
