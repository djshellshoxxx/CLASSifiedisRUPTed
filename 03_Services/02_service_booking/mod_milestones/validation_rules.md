# PS-031-02 — Validation rules: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-02.R01** Statements are validated in the order schema, signature, signer role, booking and milestone references, cid binding, business rules.
- **PS-031-02.R02** Submissions, approvals and change requests are checked against the milestone state and round limits before any change.
- **PS-031-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the booking provider for submissions and the booking client for approvals and change requests | SERVICES_STATEMENT_INVALID |
| V02 | submission has 1..10 deliverables each with a 64-hex SHA-256 and a size; kind attachment needs an F08.S01.M03 image (image/jpeg, image/png or image/webp) of at most 5 MiB; kind external_hash carries name, size and hash only; note up to 2000 code points | VALIDATION_FAILED |
| V03 | approval or change request names the cid of the latest submission | SERVICES_SUBMISSION_STALE |
| V04 | change request carries a reason of 10..1000 code points and changeRounds is below 3 | SERVICES_CHANGE_LIMIT |
| V05 | booking status is in_progress or confirmed, not disputed, conflicted or cancelled, and the milestone is not frozen by a dispute | SERVICES_BOOKING_NOT_ACTIVE |
| V06 | milestones are submitted in seq order unless the milestone is marked parallel in the client-signed quote plan | SERVICES_MILESTONE_ORDER |
| V07 | the plan taken from the accepted quote sums exactly to the booking total in one currency and every id equals uuid(sha256(bookingId + ':' + seq)) | SERVICES_MILESTONE_SUM_MISMATCH |
| V08 | a payment event is applied only when its dealId equals the dealId of an approved milestone of this booking with the same amount and currency | VALIDATION_FAILED |
| V09 | booking_completion names the completionCid derived locally from the settled milestones and is signed by the booking client or provider | SERVICES_STATEMENT_INVALID |
| V10 | sign_completion runs only when every non-cancelled milestone is settled and at least one was settled | SERVICES_COMPLETION_NOT_READY |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T02 | unit | PS-031-01.R03, PS-031-02.R02, PS-031-02.R03 | each rule V01–V10 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-031-09.T16 | unit | PS-031-02.R01 | inbound envelope with both an invalid schema and a bad signature | the schema error is returned and stored, not the signature error; statement quarantined |
| TEST-PS-031-09.T19 | abuse | PS-031-07.R04, PS-031-02.R02 | submission with a 6 MiB image, a PDF as attachment, and a PDF as external_hash | first two VALIDATION_FAILED; external hash accepted and verified locally |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
