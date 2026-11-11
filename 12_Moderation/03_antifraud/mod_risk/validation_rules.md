# PS-100-02 — Validation rules: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-02.R01** Inputs are validated strictly, and the model version must be one this build knows.
- **PS-100-02.R02** A transaction assessment requires both party keys and a bucketed amount, never the raw amount.
- **PS-100-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | subjectType and subjectRef are well-formed (did:key or uuidv7 reference) | VALIDATION_FAILED |
| V02 | modelVersion is supported (risk/1) | VALIDATION_FAILED |
| V03 | transaction assessment includes two distinct party keys and amountBucket in small, medium, large | VALIDATION_FAILED |
| V04 | the requester may assess this subject (own vault, or relay moderator with case, or subject on own key) | FORBIDDEN |
| V05 | stored assessment is not older than validUntil unless refresh is requested | RISK_ASSESSMENT_STALE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T01 | unit | PS-100-01.R01, PS-100-01.R03, PS-100-02.R01, PS-100-02.R02 | compute assessment for fixture | score equals documented sum of factor points; level per thresholds; model risk/1 recorded |
| TEST-PS-100-09.T03 | unit | PS-100-02.R03 | invalid subject, unknown model, transaction without two keys, stale read | documented error codes |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
