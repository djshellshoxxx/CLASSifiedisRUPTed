# PS-041-02 — Validation rules: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-02.R01** Statements are validated in the order schema, signature, signer role, referenced cids, state, window, business rules, and the first failure decides the error.
- **PS-041-02.R02** The comparison basis is recomputed by the receiving vault from the two reports it holds, including provenance, and must match the claim.
- **PS-041-02.R03** Every violation maps to one stable error code; quarantined statements store the code.
- **PS-041-02.R04** Windows and deadlines are absolute values carried in signed statements and judged on signed createdAt with a 72 hour receipt bound, so both vaults reach the same decision.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the owner for claims, counter acceptances and withdrawals, the renter for responses, and the designated opener for escalation notices | RENTALS_STATEMENT_INVALID |
| V02 | claim createdAt is within 7 days after the signed return attestation time and the claim is received within 72 h of createdAt, or for not_returned createdAt is between 14 days overdue and 30 days after the reservation end while the RentalReturn is overdue or contested (no attestation and no renter report the owner has not contested as not_received); refused while the RentalReturn holds a verified return_waiver (F05.S02.M02 rentals.return.get_for_reservation), checked in the sending and in the receiving vault | RENTALS_DAMAGE_WINDOW |
| V03 | basis lists at least one worsened or missing item, or kind is not_returned, and the receiver's recomputed basis including provenance equals the claimed basis | RENTALS_DAMAGE_NO_BASIS |
| V04 | items are 1..10, each description at most 300 code points with 1 to 5 evidence references, costs positive in the reservation currency | VALIDATION_FAILED |
| V05 | totalClaimed equals the sum of the item costs | VALIDATION_FAILED |
| V06 | no claim of the same kind exists for the reservation | RENTALS_DAMAGE_DUPLICATE |
| V07 | counter amount is positive, below totalClaimed, and only one counter exists | RENTALS_DAMAGE_COUNTER_LIMIT |
| V08 | a response has createdAt not after the claim's signed respondBy, a counter acceptance not after the counter's counterAnswerBy, and either is received within 72 h of its createdAt | EXPIRED |
| V09 | totalClaimed is not above ownerDeclaredValue | RENTALS_DAMAGE_EXCEEDS_VALUE |
| V10 | ownerDeclaredValue equals the declaredValue of the agreed deposit terms, or of the signed rental request when no deposit was agreed | VALIDATION_FAILED |
| V11 | before claim, respond or accept_counter, every evidence photo referenced is fetched, decrypted, SHA-256 verified and stored locally | RENTALS_EVIDENCE_MISSING |
| V12 | each evidence photo is at most 5 MiB (5 242 880 bytes) after processing | COMMS_ATTACHMENT_TOO_LARGE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-02.R03 | claim with 2 items summing to the total, and one whose total is off by 1 minor unit | first stored with claim cid; second returns VALIDATION_FAILED |
| TEST-PS-041-09.T02 | unit | PS-041-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-041-09.T03 | property | PS-041-02.R02, PS-041-03.R01, PS-041-09.R02 | random handoff and return checklists with each provenance | worsened set and provenance equal the reference model; claims without worsened items refused; basis mismatch refused on receipt |
| TEST-PS-041-09.T17 | unit | PS-041-02.R01 | inbound claim with a bad signature and a window violation; inbound response with a wrong signer and a passed respondBy | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-041-09.T18 | integration | PS-041-02.R04 | claim signed on day 6.9 delivered on day 7.5; response signed before respondBy delivered 2 days later | accepted in both vaults with the same respondBy; the response accepted in both; the return closes only after damageWindowEndsAt plus 72 h |
| TEST-PS-041-09.T23 | integration | PS-041-02.R02, PS-041-07.R02 | owner_only return, claim filed, then the renter files a return report | provenance owner_only shown on compare and response screens; recomputation against the renter's report flags the conflict |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
