# PS-131-02 — Validation rules: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-02.R01** Incident input is validated strictly, and text fields are scanned for secret patterns with the library of F16.S01.M02 before storage.
- **PS-131-02.R02** Severity, category and status transitions are validated against the matrix and lifecycle.
- **PS-131-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | title 5..140 and timeline text up to 1000 code points, and no secret-like pattern per F16.S01.M02 rules | SECURITY_INCIDENT_SECRET_IN_TEXT |
| V02 | category and severity are in their enums and scope is a component or peer ID | VALIDATION_FAILED |
| V03 | SEV1 or SEV2 incidents have a commander before moving to contained | VALIDATION_FAILED |
| V04 | closing SEV1 or SEV2 requires postmortemRef and a notification decision | SECURITY_INCIDENT_CLOSE_BLOCKED |
| V05 | timeline has fewer than 500 entries and relatedRefs fewer than 50 | PAYLOAD_TOO_LARGE |
| V06 | expectedRevision matches the incident revision | CONFLICT_REVISION |
| V07 | notice statement lists data classes and actions and no unverified claims such as no data was accessed unless evidence refs support it | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T01 | unit | PS-131-01.R01, PS-131-01.R02, PS-131-01.R03, PS-131-02.R01 | open SEV2 key_compromise with valid input | Incident stored detected, severity history has one entry, notificationDueAt = detectedAt + 72 h when data classes above P1 |
| TEST-PS-131-09.T02 | unit | PS-131-02.R02, PS-131-02.R03 | each rule V01–V07 violated | documented error code and nothing stored; secret-like text rejected |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
