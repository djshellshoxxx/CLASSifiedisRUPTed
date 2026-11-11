# PS-043-02 — Validation rules: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-02.R01** Statements are validated in the order schema, signature, signer role, reservation and report cids, state, business rules, and the first failure decides the error.
- **PS-043-02.R02** Late-fee computation uses elapsed UTC time, the terms the renter signed in the request and the effective return time bounded by verifiable evidence, never terms edited later or one vault's receipt time.
- **PS-043-02.R03** Every violation maps to one stable error code; quarantined statements store the code.
- **PS-043-02.R04** Inbound statements are judged by their signed createdAt and accepted within 72 hours of it; the silence deadline, the damage window and the effective return time derive only from signed times and relay-signed receipts, so both vaults compute the same values.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the renter for return reports, the owner for attestations, receipts, contests, fee adjustments, waivers and declarations, and owner or renter for completion signatures | RENTALS_STATEMENT_INVALID |
| V02 | handoff for the reservation is attested and the return is in the state the command requires | CONFLICT_STATE |
| V03 | checklist has at most 30 items with template ids, photos at most 20 each referencing a MediaBlob id, notes at most 1000 code points; record_received and a contest with verdict differs require 1..30 checklist items | VALIDATION_FAILED |
| V04 | attestation or contest names the cid of the latest return report | RENTALS_REPORT_STALE |
| V05 | a late fee adjustment lowers the current fee and is made before the late-fee Deal is opened, or is a full waiver afterwards | RENTALS_FEE_ADJUST_INVALID |
| V06 | closure (completion offer) is attempted only when attested, the damage window plus 72 h is over or waived, no damage claim is open and the deposit is absent, terminal or decision overdue | PRECONDITION_FAILED |
| V07 | an inbound statement has createdAt not later than receipt + 5 min and is received within 72 h of createdAt; returnedAtClaim is not later than the report createdAt + 5 min | VALIDATION_FAILED |
| V08 | a not_returned_declaration is made at least 30 days after dueAt while no owner receipt or attestation is held and every renter return report held was contested with verdict not_received | PRECONDITION_FAILED |
| V09 | before attest, contest or record_received, every photo referenced by the report or receipt is fetched, decrypted, SHA-256 verified and stored locally | RENTALS_EVIDENCE_MISSING |
| V10 | each photo is at most 5 MiB (5 242 880 bytes) after processing | COMMS_ATTACHMENT_TOO_LARGE |
| V11 | decrypted photo bytes carry no EXIF, XMP or GPS metadata | RENTALS_PHOTO_METADATA |
| V12 | a completion signature names the completionCid this vault derives from its own held cids | RENTALS_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T02 | unit | PS-043-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-043-09.T03 | property | PS-043-02.R02, PS-043-03.R02, PS-043-09.R02 | random return times, evidence times, rates, caps and adjustments against reference model | fee equals model, never above cap, adjustments only decrease; effective time within the 72 h rule |
| TEST-PS-043-09.T16 | unit | PS-043-02.R01 | inbound attestation with a bad signature and a stale report cid; inbound receipt with a wrong signer and an oversized checklist | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-043-09.T20 | integration | PS-043-02.R04 | two vaults with delayed delivery of the report, the attestation and a damage claim signed on day 6.9 | identical silence deadline, effective return time and damage window in both vaults; closure waits until damageWindowEndsAt plus 72 h |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
