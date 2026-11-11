# PS-067-02 — Validation rules: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-02.R01** Terms input is validated strictly; unknown fields are rejected with VALIDATION_FAILED.
- **PS-067-02.R02** The cash method rule validates allowed methods, jurisdiction limits and term acceptance before a claim is created.
- **PS-067-02.R03** Guidance never blocks a claim; only the listed rules do.
- **PS-067-02.R04** Incoming terms statements are checked by the StatementHandlerPort handler for signer role (payee for terms, payer for accept and decline), the referenced proposal and revision, and blocks, before any state change.
- **PS-067-02.R05** The jurisdiction cash limit is read at every check from governance.jurisdiction_profile.resolve of F18.S01.M01 with the vault's selected ProfileRefs {publisherId, code} (the query default, never a profile id) as effective.cashLimits - Money[] holding the minimum per currency across the selected profiles; the obligation amount is compared only with the entry in its own currency through F09.S03.M03, no FX conversion is made, no limit applies when no entry has that currency, and a rejection records the profileRef and version that sources names for cashLimits.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | obligation exists, cash is in allowedMethods and Deal is open | COMMERCE_CASH_NOT_ALLOWED |
| V02 | handoverHint is at most 120 code points and plain text | VALIDATION_FAILED |
| V03 | actor is the obligation payee when proposing and the payer when accepting or declining | FORBIDDEN |
| V04 | obligation amount is at most the entry of effective.cashLimits (governance.jurisdiction_profile.resolve over the vault's selected ProfileRefs) in the obligation's currency; no FX conversion, and no limit applies when no entry has that currency | COMMERCE_CASH_LIMIT_EXCEEDED |
| V05 | when the in-force terms have receiptRequired true, the cash claim signs their termsCid and those terms were accepted by the payer; a proposal not yet accepted never applies to a claim | COMMERCE_CASH_TERMS_UNACCEPTED |
| V06 | handoverHint does not match a stored private home-address pattern | COMMERCE_CASH_HINT_PRIVATE |
| V07 | at most 1 proposal per obligation per hour | RATE_LIMITED |
| V08 | set names expectedRevision equal to the revision of the in-force terms for the obligation | CONFLICT_REVISION |
| V09 | accept or decline targets the latest proposal for the obligation, which is proposed and not expired | CONFLICT_STATE |
| V10 | an ingested cash_terms statement is signed by the obligation payee and an accept or decline by the obligation payer; statements from a blocked did are dropped silently | COMMERCE_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T01 | unit | PS-067-01.R01, PS-067-01.R03, PS-067-02.R01 | propose valid terms | row stored with acknowledgementRequired true, status proposed, replacesTermsCid of the defaults, signed statement created |
| TEST-PS-067-09.T02 | unit | PS-067-02.R02 | each rule V01 to V10 violated in turn | documented error code and nothing stored |
| TEST-PS-067-09.T16 | integration | PS-067-04.R04, PS-067-02.R04 | vault B ingests cash_terms signed by the payer, an accept signed by the payee, a duplicate and a valid terms statement | first two quarantined with signer_not_payee or signer_not_payer; duplicate is a no-op; the valid one applied once |
| TEST-PS-067-09.T17 | unit | PS-067-02.R03 | cash claim above the elevated guidance threshold with the guidance dismissed unread | claim allowed; guidance shown but never blocks; only V01, V04 and V05 can refuse a claim |
| TEST-PS-067-09.T21 | contract | PS-067-02.R05, PS-067-02.R02 | resolve stub returns cashLimits [EUR 1 000.00, USD 500.00] with sources naming {P, eu_de} version 3; cash obligations of EUR 2 500.00, EUR 1 000.00 and GBP 5 000.00; then a fallback resolve with empty cashLimits | resolve called with the vault's selected ProfileRefs and no profile id; EUR 2 500.00 refused with COMMERCE_CASH_LIMIT_EXCEEDED and details {limit EUR 1 000.00, profileRef {P, eu_de}, profileVersion 3}; EUR 1 000.00 and GBP 5 000.00 allowed with no FX conversion; fallback allows every amount |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
