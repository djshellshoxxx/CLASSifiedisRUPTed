# PS-073-02 — Validation rules: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-02.R01** Registration is validated against the schema and the configured chain list before persistence.
- **PS-073-02.R02** Every lookup of an unknown code returns COMMERCE_CURRENCY_UNKNOWN with the offending code in params.
- **PS-073-02.R03** Status changes check for dependent open records through the CurrencyUsagePort.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | fiat code is exactly 3 uppercase letters and present in the bundled ISO 4217 snapshot | COMMERCE_CURRENCY_UNKNOWN |
| V02 | crypto code matches 2 to 10 characters of A-Z and 0-9 and does not collide with an ISO code | VALIDATION_FAILED |
| V03 | decimals is within the allowed range for the kind | VALIDATION_FAILED |
| V04 | crypto asset chainId is configured and contract address is valid for that chain | COMMERCE_CURRENCY_CHAIN_UNSUPPORTED |
| V05 | code not already registered in this vault | COMMERCE_CURRENCY_EXISTS |
| V06 | decimals, kind and chain binding equal the stored values on update | COMMERCE_CURRENCY_IMMUTABLE |
| V07 | currency used in a new Money value is active | COMMERCE_CURRENCY_DISABLED |
| V08 | retirement only when no open deal, offer or quote references the code | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T01 | unit | PS-073-01.R01, PS-073-01.R02, PS-073-02.R01 | register a crypto asset with valid data | row stored with revision 1, decimals and chain binding intact |
| TEST-PS-073-09.T02 | unit | PS-073-02.R01, PS-073-02.R02 | lookup of XXX9 and of a withdrawn code | COMMERCE_CURRENCY_UNKNOWN with code in params |
| TEST-PS-073-09.T03 | unit | PS-073-01.R03, PS-073-02.R03, PS-073-09.R03 | update attempt on decimals and chain binding | COMMERCE_CURRENCY_IMMUTABLE and nothing stored |
| TEST-PS-073-09.T05 | integration | PS-073-03.R03, PS-073-02.R03 | retire a currency referenced by an open offer | PRECONDITION_FAILED until references are closed |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
