# PS-004-02 — Validation rules: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-02.R01** Publication is allowed only for a complete listing whose kind-specific terms exist and whose region is at least L1.
- **PS-004-02.R02** Policy checks run in the vault before signing and cannot be skipped by the caller.
- **PS-004-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | listing status is draft, unpublished or expired and moderationLock is not set by a relay notice for the same relay | BAZAAR_PUBLISH_NOT_ALLOWED |
| V02 | title >= 3 and description >= 10 code points; kind sell has SellTerms, wanted has WantSpec, giveaway has GiveawayTerms | BAZAAR_PUBLISH_INCOMPLETE |
| V03 | regionCell present with length 4 or 5 and mediaRefs have no GPS tag | BAZAAR_PUBLISH_INCOMPLETE |
| V04 | category is active and, if restricted for the chosen jurisdiction profile, notices are acknowledged | BAZAAR_PUBLISH_BLOCKED |
| V05 | prohibited-item verdict is not block | BAZAAR_PUBLISH_BLOCKED |
| V06 | verdict review requires ownerConfirmedAt | BAZAAR_PUBLISH_CONFIRMATION_REQUIRED |
| V07 | expiresInDays between 1 and 90 | VALIDATION_FAILED |
| V08 | 1 to 10 destination relays, each a user-selected relay known to the vault | VALIDATION_FAILED |
| V09 | vault has fewer than 100 active publications | BAZAAR_PUBLISH_LIMIT |
| V10 | device clock within 24 h of the newest relay receipt seen | PRECONDITION_FAILED |
| V11 | renew only in the last 7 days of life, renewals < 3 and total life <= 120 days | BAZAAR_PUBLISH_RENEW_NOT_ALLOWED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T03 | unit | PS-004-02.R01, PS-004-02.R02, PS-004-02.R03 | violate each rule V01-V11 | documented error code returned, no statement signed |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
