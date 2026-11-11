# PS-070-02 — Validation rules: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-02.R01** Case and evidence input is validated strictly, including context resolution through the DisputeContextPort and party membership.
- **PS-070-02.R02** Incoming statements are verified for signature, signer role and chain position before any state change.
- **PS-070-02.R03** Outcome rules enforce who must accept and that outcomes carry no executable money action.
- **PS-070-02.R04** Context types are a registry - only types a module registered through DisputeContextPort are accepted, and an unregistered type or a context the resolver cannot resolve returns COMMERCE_DISPUTE_CONTEXT_INVALID.
- **PS-070-02.R05** A block never removes the right to dispute - commerce.dispute.open is never refused with BLOCKED_PARTY for any context type, including booking cases opened through the F03.S02.M03 port and rental_deposit or rental_damage cases of a reservation confirmed before the block (N7a), and serviceScope is accepted only for booking contexts.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextRef.type is registered through DisputeContextPort and resolve(contextRef) returns parties that include the actor | COMMERCE_DISPUTE_CONTEXT_INVALID |
| V02 | respondents are the other parties returned by DisputeContextPort.resolve, between 1 and 19 | VALIDATION_FAILED |
| V03 | no non-terminal case exists for the same context and opener | COMMERCE_DISPUTE_DUPLICATE |
| V04 | description is 1 to 1000 code points plain text | VALIDATION_FAILED |
| V05 | evidence per party at most 20 items, each attachment a MediaBlob ref of at most 5 MiB, case total at most 50 MiB, caption at most 280 code points | COMMERCE_DISPUTE_EVIDENCE_LIMIT |
| V06 | evidence refCid resolves to a record the author holds or is an attachment hash the author supplies | VALIDATION_FAILED |
| V07 | mediator selection names a relayId and mediator did; the mediator becomes active only when every party of the case (opener and all respondents) has signed acceptance, and no evidence is shared before that | COMMERCE_DISPUTE_MEDIATOR_UNAVAILABLE |
| V08 | outcome type is one of the four types; advisoryRefund only with refund_claimed and in a registry currency | COMMERCE_DISPUTE_OUTCOME_INVALID |
| V09 | no_fault_close and enforcement_referral by an active, relay-verified mediator need no acceptance; refund_claimed, return_agreed and any outcome proposed by a party or a self-declared mediator need acceptance by every party | COMMERCE_DISPUTE_OUTCOME_INVALID |
| V10 | statement signature valid and signer authorized for the role in the case | COMMERCE_DISPUTE_STATEMENT_INVALID |
| V11 | outcome proposal round is at most 3 | CONFLICT_STATE |
| V12 | a mediator-only outcome requires a directory entry signed by the named relay's key, naming that mediator did and relayId and not past validUntil | COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED |
| V13 | a disposition is advisory only - kind continue, settled, cancelled or waived, favouredDid one of the parties, agreedAmount in a registry currency and only with kind settled | COMMERCE_DISPUTE_OUTCOME_INVALID |
| V14 | attachment bytes passed F10.S02.M03 stripping before encryption and the MediaBlob digest matches the bytes | VALIDATION_FAILED |
| V15 | a statement from a blocked did is dropped silently only when it belongs to no open case of this vault; statements of an open case are stored with notifications suppressed, and open is allowed against a blocked party for every context type (booking, rental_deposit and rental_damage included) | BLOCKED_PARTY |
| V16 | serviceScope is present only with contextRef type booking and carries scope, a scopeKey of 1 to 200 characters and an optional milestoneId uuid; idempotencyRef is at most 64 characters | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T01 | unit | PS-070-01.R01, PS-070-01.R02, PS-070-02.R01 | open a case on a deal | case stored with deadlines and parties from DisputeContextPort, signed statement created, caseId deterministic |
| TEST-PS-070-09.T02 | unit | PS-070-01.R03, PS-070-02.R03 | inspect schema and propose refund_claimed with advisoryRefund and a settled disposition | no executable field exists; advisory refund and disposition stored; no payment API called |
| TEST-PS-070-09.T03 | unit | PS-070-02.R02, PS-070-02.R03 | rules V01 to V15 violated in turn | documented error code and nothing stored |
| TEST-PS-070-09.T08 | integration | PS-070-04.R03, PS-070-02.R01 | commerce.payment.disputed delivered | draft prefilled, no case opened automatically |
| TEST-PS-070-09.T24 | unit | PS-070-02.R04, PS-070-01.R06 | open cases for each registered type and for an unregistered type | registered types store parties and contextCid from their resolver; unregistered returns COMMERCE_DISPUTE_CONTEXT_INVALID |
| TEST-PS-070-09.T28 | integration | PS-070-04.R07, PS-070-02.R05 | F03.S02.M03 port opens a booking case with serviceScope {scope, scopeKey, milestoneId} and idempotencyRef L1 against a counterparty the opener blocked, then retries with L1; a deal case carrying serviceScope; owner opens rental_deposit and rental_damage cases against a renter blocked after confirmation | booking case opened, serviceScope signed into dispute/v1 and carried in commerce.dispute.opened; the retry returns the same caseId with no new statement; the deal case returns VALIDATION_FAILED; no open is refused with BLOCKED_PARTY |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
