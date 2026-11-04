# PS-098-02 — Validation rules: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-02.R01** Override input is validated strictly with bounded value, reason and expiry.
- **PS-098-02.R02** Limit checks validate the limit key and treat unknown keys as denied.
- **PS-098-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | limitKey is in the enum and overrideValue is an integer 0..10000 | VALIDATION_FAILED |
| V02 | overrideReason 10..500 code points and expiry between 1 hour and 90 days | VALIDATION_FAILED |
| V03 | the overriding moderator is not the subject key | FORBIDDEN |
| V04 | expectedRevision matches the AccountLimit revision | CONFLICT_REVISION |
| V05 | check for stock limits supplies currentCount ≥ 0 | VALIDATION_FAILED |
| V06 | usage after the check would not exceed the effective value | ACCOUNT_LIMIT_REACHED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R03, PS-098-02.R01 | tier table for A, B, C on all five limit keys | A new (5, 10, 3, 20, 20), B established (20, 50, 10, 100, 60), C trusted (100, 200, 25, 500, 200) |
| TEST-PS-098-09.T03 | unit | PS-098-02.R01, PS-098-02.R02, PS-098-02.R03 | override with value 10001, short reason, expiry 91 days, self override | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-098-09.T07 | integration | PS-098-02.R03, PS-098-06.R02 | 6th listing in a day for tier new; stock limit with currentCount 10 of 10 | ACCOUNT_LIMIT_REACHED with resetsAt for flow; without for stock |

## Dependencies

Module depends on: F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
