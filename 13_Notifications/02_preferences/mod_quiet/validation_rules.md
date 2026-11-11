# PS-108-02 — Validation rules: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-02.R01** Dispatch requests are validated for template, category, reference and urgency before the gate decides.
- **PS-108-02.R02** The gate procedure is deterministic, side-effect free until the decision is applied, and applies the same order everywhere.
- **PS-108-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | templateKey matches notify.tpl.<category>.<name>, category is one of the seven, and ref contains only type and opaque ID | VALIDATION_FAILED |
| V02 | urgency urgent is allowed only for category security, otherwise it is treated as normal and flagged | VALIDATION_FAILED |
| V03 | the caller is a registered device of the user (self wake) or a relay service hook, and the user has a granted unexpired channel consent for push or email | PRECONDITION_FAILED |
| V04 | the matrix allows the category on the channel (F13.S02.M04 resolve) | NOTIFY_CATEGORY_DISABLED |
| V05 | release time does not exceed deferredAt plus 24 hours | NOTIFY_DEFER_EXPIRED |
| V06 | a relay accepts at most 120 dispatch requests per user per hour and 30 per minute per caller | RATE_LIMITED |
| V07 | collapseKey is at most 64 characters of the set a-z A-Z 0-9 - _ . | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | dispatch normal offers alert at 03:00 local | deferred record with only templateKey, ref and timing; no text fields; release at 07:00 plus jitter |
| TEST-PS-108-09.T02 | unit | PS-108-02.R02, PS-108-02.R03 | each rule V01 to V07 violated in turn | documented error code returned and nothing sent |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent | first sent immediately; second treated as normal and deferred; third not sent |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
