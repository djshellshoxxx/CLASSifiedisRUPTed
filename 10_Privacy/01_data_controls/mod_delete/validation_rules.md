# PS-077-02 — Validation rules: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-02.R01** Requests are validated for fresh unlock, typed confirmation and the single-active-request rule.
- **PS-077-02.R02** Execution validates that grace has ended, that deferral limits are respected and that every registered module has a plan.
- **PS-077-02.R03** Incoming relay deletion statements are verified for signature by a registered key of the did and for freshness.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | vault unlocked within the last 5 minutes | UNAUTHENTICATED |
| V02 | typed confirmation equals the principal's pseudonym | VALIDATION_FAILED |
| V03 | no other deletion request is active in this vault | PRECONDITION_FAILED |
| V04 | cancel only while pending_grace or deferred | CONFLICT_STATE |
| V05 | execution starts only at or after graceEndsAt | PRIVACY_DELETION_GRACE_ACTIVE |
| V06 | deferral lasts at most 30 days beyond graceEndsAt | PRIVACY_DELETION_DEFERRAL_LIMIT |
| V07 | every registered DeletionPort module returns a plan before executing | PRIVACY_DELETION_PLAN_MISSING |
| V08 | relay statement signature valid over JCS bytes, signer is a registered key of the did, signedAt within 24 h | PRIVACY_DELETION_STATEMENT_INVALID |
| V09 | publishing and new commitments refused while a request is active | PRIVACY_DELETION_PENDING |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-01.R01, PS-077-01.R02, PS-077-02.R01, PS-077-02.R02 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T02 | unit | PS-077-01.R03, PS-077-02.R03, PS-077-03.R01 | cancel at day 13; try to cancel while executing | cancelled with salt destroyed; executing refuses with CONFLICT_STATE |
| TEST-PS-077-09.T03 | unit | PS-077-02.R03, PS-077-03.R02 | commitments open at day 14, then clear at day 20, then limit reached | deferred then executing; at day 44 execution proceeds with notices sent |
| TEST-PS-077-09.T12 | abuse | PS-077-07.R03, PS-077-02.R03 | publish a listing and create a deal during grace | PRIVACY_DELETION_PENDING |

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
