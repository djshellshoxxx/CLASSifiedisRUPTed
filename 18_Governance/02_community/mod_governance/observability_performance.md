# PS-147-08 — Observability and performance: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-08.R01** No telemetry leaves the device (OBS-7); counters are local diagnostics.
- **PS-147-08.R02** Relay comment acceptance follows OBS-1 to OBS-4.
- **PS-147-08.R03** Verification must be fast because other modules call it before applying changes.

## Specification

**Metrics**
- classrup_governance_proposals_total{outcome} (local)
- classrup_governance_comments_total{outcome} (relay and local)
- classrup_governance_verify_duration_ms (local histogram)
- classrup_governance_pending_statements{reason} (local gauge)

**Logs**
- info policy_proposal.decided {proposalId, outcome, correlationId} in local diagnostics.
- warn policy_proposal.conflicted {proposalId, conflictCount, correlationId}; never comment bodies.

**Budgets**
- verify p95 <= 20 ms with cached statements; receive p95 <= 80 ms including signature verification on Moto G-class hardware.
- Relay comment accept p95 <= 300 ms at 50 req/s.
- Proposal list of 50 items p95 <= 100 ms.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T13 | load | PS-147-08.R01, PS-147-08.R02, PS-147-08.R03 | 1 000 comments on Moto G profile, relay at 50 req/s | verify p95 <= 20 ms, receive p95 <= 80 ms, relay p95 <= 300 ms, no telemetry |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
