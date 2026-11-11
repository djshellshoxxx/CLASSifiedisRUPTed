# PS-062-08 — Observability and performance: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-08.R01** The PWA keeps local diagnostics only (OBS-7) with counters for signed, accepted, quarantined and rejected statements, and no statement content is logged.
- **PS-062-08.R02** Signing including canonicalization meets a vault budget of p95 ≤ 100 ms and verification p95 ≤ 20 ms on a mid-range phone.
- **PS-062-08.R03** Verification of 1 000 stored statements completes within 5 s.

## Specification

**Metrics**
- classrup_comms_consents_total{outcome=signed|accepted|quarantined|rejected|revoked|aliased} (local diagnostics)
- classrup_comms_consent_verify_ms (histogram, local diagnostics)

**Logs**
- local info consent.signed {consentId, subjectType} — no wording and no subject content.
- local warn consent.rejected {code, subjectType}.

**Budgets**
- sign p95 ≤ 100 ms; verify p95 ≤ 20 ms; accept p95 ≤ 50 ms.
- Batch verification of 1 000 statements ≤ 5 s.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T11 | load | PS-062-08.R01, PS-062-08.R02, PS-062-08.R03 | sign 200 statements and verify 1 000 | budgets met |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
