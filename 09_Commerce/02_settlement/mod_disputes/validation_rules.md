# PS-070-02 — Validation rules: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-02.R01** Case and evidence input is validated strictly, including context resolution in the local vault and party membership.
- **PS-070-02.R02** Incoming statements are verified for signature, signer role and chain position before any state change.
- **PS-070-02.R03** Outcome rules enforce who must accept and that outcomes carry no executable money action.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextRef resolves in the local vault and the actor is a party of the context | COMMERCE_DISPUTE_CONTEXT_INVALID |
| V02 | respondents are the other parties of the context, between 1 and 19 | VALIDATION_FAILED |
| V03 | no non-terminal case exists for the same context and opener | COMMERCE_DISPUTE_DUPLICATE |
| V04 | description is 1 to 1000 code points plain text | VALIDATION_FAILED |
| V05 | evidence per party at most 20 items, each at most 10 MiB, case total at most 50 MiB, caption at most 280 code points | COMMERCE_DISPUTE_EVIDENCE_LIMIT |
| V06 | evidence refCid resolves to a record the author holds or is an attachment hash the author supplies | VALIDATION_FAILED |
| V07 | mediator selection names a relay and moderator did and both parties accept before any evidence is shared | COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE |
| V08 | outcome type is one of the four types; advisoryRefund only with refund_claimed and in a registry currency | COMMERCE_DISPUTE_OUTCOME_INVALID |
| V09 | no_fault_close and enforcement_referral by a mediator need no acceptance; refund_claimed and return_agreed need acceptance by every party | COMMERCE_DISPUTE_OUTCOME_INVALID |
| V10 | statement signature valid and signer authorized for the role in the case | COMMERCE_DISPUTE_STATEMENT_INVALID |
| V11 | outcome proposal round is at most 3 | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund | no executable field exists; advisory refund stored; no payment API called |
| TEST-PS-070-09.T03 | unit | PS-070-02.R02, PS-070-02.R03 | rules V01 to V11 violated in turn | documented error code and nothing stored |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
