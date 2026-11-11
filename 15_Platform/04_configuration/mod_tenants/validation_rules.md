# PS-125-02 — Validation rules: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-02.R01** Tenant input is validated strictly; unknown fields are rejected with VALIDATION_FAILED and each violation lists its field path.
- **PS-125-02.R02** Currency, locale and profile values are validated for format here and for registry membership by their owning modules at use time.
- **PS-125-02.R03** Operator assignment rules protect the community from becoming unmanageable, and operators can be added only by an admin with an expiry.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | slug matches ^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$ | VALIDATION_FAILED |
| V02 | displayName is 1..80 characters of plain text | VALIDATION_FAILED |
| V03 | allowedCurrencies has 1..20 distinct codes matching ^[A-Z0-9]{2,12}$ | VALIDATION_FAILED |
| V04 | defaultLocale matches ^[a-z]{2,3}(-[A-Z]{2})?$ and jurisdictionProfile matches ^[a-z0-9_-]{2,40}$ | VALIDATION_FAILED |
| V05 | each limit is within its documented range, maxUploadBytes and maxLocalAttachmentBytes ≤ 5242880 and maxEnvelopeBytes ≤ 262144 | VALIDATION_FAILED |
| V06 | create and bootstrap name 1..10 distinct valid did:key Ed25519 operator keys and, when the relay has no admin yet, one admin key | VALIDATION_FAILED |
| V07 | removing an operator assignment through this module leaves at least 1 active operator assignment of scope tenant:<id> | PLATFORM_TENANT_LAST_OPERATOR |
| V08 | member writes to a tenant require status active (TenantPort stage of the bus); configure and assign_operator are allowed in active and suspended and refused in archived | PLATFORM_TENANT_SUSPENDED |
| V09 | the relay hosts at most 50 tenants | PLATFORM_TENANT_LIMIT |
| V10 | expectedRevision equals the stored revision | CONFLICT_REVISION |
| V11 | slug is not in use by another tenant on this relay | PLATFORM_TENANT_SLUG_TAKEN |
| V12 | an operator added through assign_operator carries expiresInMs ≤ 31536000000 (365 days), as F16.S01.M01 requires for operator roles | VALIDATION_FAILED |
| V13 | a LocalSettings patch never contains vaultId and localLimits stay within their ranges | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T01 | unit | PS-125-01.R01, PS-125-01.R02, PS-125-02.R01 | create a tenant with valid input | stored with revision 1, status active, defaults applied, schema classrup.platform.tenant/v1, operatorKeys read from F16 |
| TEST-PS-125-09.T02 | unit | PS-125-02.R01, PS-125-02.R02, PS-125-02.R03 | each rule V01-V13 violated in turn | documented code returned and nothing stored; a malformed slug gets VALIDATION_FAILED and a used slug PLATFORM_TENANT_SLUG_TAKEN; fields list the offending paths |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
