# PS-067-02 — Validation rules: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-02.R01** Terms input is validated strictly; unknown fields are rejected with VALIDATION_FAILED.
- **PS-067-02.R02** The cash method rule validates allowed methods, jurisdiction limits and term acceptance before a claim is created.
- **PS-067-02.R03** Guidance never blocks a claim; only the listed rules do.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | obligation exists, cash is in allowedMethods and Deal is open | COMMERCE_CASH_NOT_ALLOWED |
| V02 | handoverHint is at most 120 code points and plain text | VALIDATION_FAILED |
| V03 | actor is the obligation payee when proposing and the payer when accepting | FORBIDDEN |
| V04 | obligation amount is at most the jurisdiction cash limit when a limit is configured | COMMERCE_CASH_LIMIT_EXCEEDED |
| V05 | when receiptRequired is accepted, a cash claim is allowed only after acceptance | COMMERCE_CASH_TERMS_UNACCEPTED |
| V06 | handoverHint does not match a stored private home-address pattern | COMMERCE_CASH_HINT_PRIVATE |
| V07 | at most 1 proposal per obligation per hour | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T01 | unit | PS-067-01.R01, PS-067-01.R03, PS-067-02.R01 | propose valid terms | row stored with acknowledgementRequired true, status proposed, signed statement created |
| TEST-PS-067-09.T02 | unit | PS-067-02.R02, PS-067-02.R03 | each rule V01 to V07 violated in turn | documented error code and nothing stored |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F18.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
