# PS-041-04 — Commands, queries and events: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-04.R01** Vault commands claim, respond, accept_counter, withdraw, escalate and renegotiate produce named signed statements where the other party must rely on them, and a sync outbox entry, in the same vault transaction.
- **PS-041-04.R02** One ingestion command applies inbound statements, deduplicates by cid, recomputes the comparison, derives local events with actor.kind federated and quarantines failures.
- **PS-041-04.R03** Payment status of an agreed amount is derived from F09 events whose contextRef is {rental_damage, claimId} of this module; the module never creates a PaymentClaim itself.
- **PS-041-04.R04** The excess over the deposit is a separate commerce.deal.open with contextRef {rental_damage, claimId} and contextCid the acceptance, counter acceptance or dispute outcome cid, the dispute contextRef is {rental_damage, claimId}, and every statement schema is registered with its signer role in F11.S01.M01.
- **PS-041-04.R05** A referenced evidence photo is detected as missing only when comms.attachment.download returns NOT_FOUND during ingestion or a re-fetch; it keeps claim, respond and accept_counter refused with RENTALS_EVIDENCE_MISSING and is re-requested from the author through the thread, and comms.attachment.deleted, which F08.S01.M03 emits only in the uploader vault, is not consumed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.damage.claim` | rentals.damage.claim | [statement classrup.rentals.damage_claim/v1 signed by owner, E2E encrypted to renter, carrying the basis with provenance, ownerDeclaredValue copied from the deposit terms or signed request and the absolute respondBy] { reservationId, kind, items[] } | { claimId, claimCid, basis, ownerDeclaredValue, respondBy, syncState } | NOT_FOUND, VALIDATION_FAILED, RENTALS_DAMAGE_WINDOW, RENTALS_DAMAGE_NO_BASIS, RENTALS_DAMAGE_EXCEEDS_VALUE, RENTALS_DAMAGE_DUPLICATE, RENTALS_EVIDENCE_MISSING, COMMS_ATTACHMENT_TOO_LARGE | rentals.damage.claimed | yes (Idempotency-Key) |
| `rentals.damage.respond` | rentals.damage.respond | [statement classrup.rentals.damage_response/v1 signed by renter over the claim cid; a counter carries the absolute counterAnswerBy] { claimId, expectedRevision, claimCid, kind: accepted\|counter\|contest, counterAmount?, note? } | { claimId, revision, state, responseCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, VALIDATION_FAILED, RENTALS_DAMAGE_COUNTER_LIMIT, RENTALS_EVIDENCE_MISSING | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.accept_counter` | rentals.damage.decide | [statement classrup.rentals.damage_counter_acceptance/v1 signed by owner over the response cid] { claimId, expectedRevision, responseCid } | { claimId, revision, agreedAmount: Money, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, RENTALS_EVIDENCE_MISSING | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.withdraw` | rentals.damage.decide | [statement classrup.rentals.damage_withdrawal/v1 signed by owner] { claimId, expectedRevision } | { claimId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.escalate` | rentals.damage.escalate | [vault command on explicit user action by the designated opener; calls F09.S02.M02 commerce.dispute.open {contextRef {type rental_damage, id claimId}, reason, evidence the user selects} from the prefilled draft; sends classrup.rentals.damage_escalation/v1 signed by the opener to the other party] { claimId, expectedRevision, statement } | { claimId, revision, disputeCaseId?, noticeCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE, VALIDATION_FAILED, FORBIDDEN |  | yes (Idempotency-Key) |
| `rentals.damage.renegotiate` | rentals.damage.renegotiate | [statement classrup.rentals.damage_renegotiation/v1 signed by the proposing party naming the statements that stand, co-signed by the other over the same cid] { claimId, expectedRevision, standingCids[], renegotiationCid? } | { claimId, revision, renegotiationCid, signatures: 1 \| 2, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.damage.receive` | rentals.damage.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001; recomputes the basis and fetches evidence photos] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_DAMAGE_NO_BASIS, RENTALS_DAMAGE_WINDOW, EXPIRED, VALIDATION_FAILED, CONFLICT_STATE | rentals.damage.claimed, rentals.damage.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.damage.compare_reports` | rentals.damage.read_own | [vault-local] { reservationId } | { rows: [{ checklistItemId, handoffCondition, returnCondition, worsened: boolean, photoPairs[] }], worsenedItemIds[], provenance: bilateral\|owner_only\|renter_only, conflictingReportCid?, eligible: boolean, windowEndsAt, waived: boolean } | NOT_FOUND |
| `rentals.damage.get` | rentals.damage.read_own | [vault-local] { claimId } | { claim: DamageClaim, paymentProof?: none\|claimed\|acknowledged\|confirming\|final\|disputed\|expired, draftCase? } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.damage.claimed` | P2 | { claimId, reservationId, ownerId, renterId, kind, totalClaimed, claimCid, respondBy } |
| `rentals.damage.resolved` | P2 | { claimId, reservationId, ownerId, renterId, kind, outcome, disputeResolution?, agreedAmount?, disputeCaseId? } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | store the attested handoff report cid as the baseline for comparisons |
| `rentals.return.attested` | open the 7 day claim window from attestedAtClaim; take returnConditionCid and attestedBy (both -> bilateral, owner_only or owner_differs -> owner_only with conflictingReportCid) as the comparison basis |
| `rentals.rental.overdue` | start the 14 day clock after which a not_returned claim is allowed |
| `rentals.rental.closed` | close the claim window; later claims return RENTALS_DAMAGE_WINDOW |
| `rentals.deposit.released` | for an accepted or resolved claim of the reservation record retainedFromDeposit (the retainedAmount when the event names this damageClaimId, else 0) and open the excess Deal for agreedAmount minus retained when above 0 |
| `commerce.dispute.opened` | for contextRef exactly {rental_damage, claimId}, link the case id and move escalated_pending to escalated |
| `commerce.dispute.resolved` | for contextRef exactly {rental_damage, claimId}, apply the outcome mapping in the note |
| `commerce.dispute.withdrawn` | for contextRef exactly {rental_damage, claimId}, return the claim to escalatedFrom |
| `commerce.payment.acknowledged` | for contextRef {rental_damage, claimId} record payment proof acknowledged |
| `commerce.payment.finalized` | for contextRef {rental_damage, claimId} record payment proof final (F09.S01.M03) |
| `identity.block.added` | suppress notifications for the counterparty through filterBlocked; damage statements for reservations confirmed before the block are still verified and stored |
| `privacy.deletion.completed` | replace the deleted party's DID in retained claims and statement metadata with the deletion pseudonym; signed statements and evidence copies are kept so signatures and hashes still verify |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_DAMAGE_WINDOW | 409 | no | claim is outside its allowed window, or damage claims were waived at return |
| RENTALS_DAMAGE_NO_BASIS | 422 | no | reports show no worsened or missing item, or the claimed basis differs from the recomputed one |
| RENTALS_DAMAGE_EXCEEDS_VALUE | 422 | no | total claimed is above the declared value the renter agreed |
| RENTALS_DAMAGE_DUPLICATE | 409 | no | a claim of this kind already exists for the reservation |
| RENTALS_DAMAGE_COUNTER_LIMIT | 409 | no | only one counter is allowed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles registered in F11.S01.M01 (N2): classrup.rentals.damage_claim/v1 (owner), classrup.rentals.damage_response/v1 (renter), classrup.rentals.damage_counter_acceptance/v1 (owner), classrup.rentals.damage_withdrawal/v1 (owner), classrup.rentals.damage_escalation/v1 (the designated opener, owner or renter), classrup.rentals.damage_renegotiation/v1 (owner and renter, both signatures over one cid). Disputes: contextRef {rental_damage, claimId}; commerce.dispute.opened, resolved and withdrawn apply only when their contextRef matches exactly. Outcome mapping: refund_claimed or return_agreed with every party in acceptedBy -> resolved with agreedAmount = advisoryRefund (0 when absent, capped at totalClaimed), where advisoryRefund in a {rental_damage} case is always the amount the renter pays the owner, whichever party opened; no_fault_close, enforcement_referral, lapsed -> resolved_unsettled without agreedAmount; withdrawn -> escalatedFrom. Draft cases: the prefilled commerce.dispute.open input (reason, description, selected evidence) is held in this vault, and F09.S02.M02 sees nothing until the designated opener opens it. Settlement (N5): with a funded deposit the agreed amount is prefilled into an F05.S01.M02 forfeit claim referencing this claimId; when rentals.deposit.released arrives for the reservation (retainedFromDeposit = its retainedAmount when its damageClaimId is this claim, else 0), or immediately when no funded deposit exists, the owner vault opens commerce.deal.open {contextRef {rental_damage, claimId}, contextCid the acceptance, counter acceptance or outcome cid, one obligation renter to owner of agreedAmount minus retained, purpose damage} if that is above 0. This module implements the F09.S01.M01 ContextTermsPort for rental_damage - verify recomputes the single renter-to-owner obligation from the acceptance, counter acceptance or outcome statement and the retained amount, openerRole and ownerRole are owner. Blocks (N7): damage statements for a reservation confirmed before a block - claims, responses, counters, notices - are verified and stored with notifications suppressed, so a block can neither suppress a response nor strand a claim; notifications are suppressed through F07.S02.M02 filterBlocked and isBlockedEither is never used to drop these statements.

### Example

```
owner vault: rentals.damage.compare_reports { "reservationId": "0192f500-0002-…" } -> worsenedItemIds ["tent-pole"], provenance bilateral, eligible true
rentals.damage.claim { "reservationId": "0192f500-0002-…", "kind": "damage",
  "items": [{ "checklistItemId": "tent-pole", "description": "Bent pole", "estimatedCost": { "amount": "4500", "currency": "EUR" }, "evidenceRefs": ["0192f540-00a1-…"] }] }
  -> { "respondBy": "2026-12-18T10:00:00.000Z", "ownerDeclaredValue": { "amount": "30000", "currency": "EUR" } }
renter: rentals.damage.respond { "kind": "counter", "counterAmount": { "amount": "2500", "currency": "EUR" } } -> countered; owner accept_counter -> accepted, agreedAmount EUR 25.00
agreed amount is prefilled into rentals.deposit.claim_forfeit; any excess becomes commerce.deal.open { "contextRef": { "type": "rental_damage", "id": "0192f541-…" } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T06 | integration | PS-041-04.R01, PS-041-04.R03 | accept path with a funded deposit that retains EUR 25.00 of an agreed EUR 45.00; accept path without a deposit; accept path where the deposit is released in full without a forfeit for this claim | forfeit prefilled with the claim id; excess Deal {rental_damage, claimId} with purpose damage opened by the owner vault for EUR 20.00, EUR 45.00 and EUR 45.00 respectively; the same damage is never recovered twice; resolved emitted once |
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T08 | contract | PS-041-04.R01, PS-041-04.R03, PS-041-04.R04 | each command, statement, Deal call and event | payloads and signatures validate against registry schemas and signer roles; dispute and Deal calls carry contextRef {rental_damage, claimId} |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-04.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |
| TEST-PS-041-09.T24 | integration | PS-041-07.R04, PS-041-04.R05 | relay blob of an evidence photo expired before the renter fetched it; owner deletes the thread message after the renter stored the photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND and the photo is re-requested; respond refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify after deletion |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
