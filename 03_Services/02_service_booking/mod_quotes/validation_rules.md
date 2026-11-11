# PS-032-02 — Validation rules: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-02.R01** Every inbound statement is validated in a fixed order - schema, signature, signer role, referenced cids, expiry, business rules - and the first failure decides the error.
- **PS-032-02.R02** Business rules check offering state, blocks, limits, money and slot availability before any state changes.
- **PS-032-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies over JCS bytes and author key matches the required role | SERVICES_STATEMENT_INVALID |
| V02 | offering is published locally or in a stored verified projection and provider key matches | SERVICES_OFFERING_NOT_BOOKABLE |
| V03 | description 10..2000 code points and budget, when present, is positive in a registered currency | VALIDATION_FAILED |
| V04 | milestonePlan sums exactly to total and has at most 10 items | SERVICES_MILESTONE_SUM_MISMATCH |
| V05 | validUntil is within 1 h..14 d of issue and acceptance occurs before validUntil plus 5 minutes by the provider clock | EXPIRED |
| V06 | acceptance quoteCid equals the issued quote cid and the quote is not superseded or withdrawn | SERVICES_QUOTE_NOT_ACCEPTABLE |
| V07 | client has fewer than 5 open requests and fewer than 2 per provider | SERVICES_REQUEST_LIMIT |
| V08 | neither party has blocked the other | BLOCKED_PARTY |
| V09 | slot hold for the quote is still held and not expired at confirmation | SERVICES_SLOT_UNAVAILABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T02 | unit | PS-032-01.R03, PS-032-02.R01, PS-032-02.R02, PS-032-02.R03 | each rule V01–V09 violated in turn | documented code returned and nothing stored, bad statements quarantined |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
