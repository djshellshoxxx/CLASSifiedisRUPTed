# PS-041-04 — Commands, queries and events: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-04.R01** Vault commands claim, respond, accept_counter, withdraw and escalate produce named signed statements where the other party must rely on them, and a sync outbox entry, in the same vault transaction.
- **PS-041-04.R02** One ingestion command applies inbound statements, deduplicates by cid, recomputes the comparison, derives local events with actor.kind federated and quarantines failures.
- **PS-041-04.R03** Payment status of an agreed amount is derived from F09 events whose context is a rental_damage record of this module; the module never creates a PaymentClaim itself.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.damage.claim` | rentals.damage.claim | [statement classrup.rentals.damage_claim/v1 signed by owner, E2E encrypted to renter] { reservationId, kind, items[], ownerDeclaredValue } | { claimId, claimCid, basis, respondBy, syncState } | NOT_FOUND, VALIDATION_FAILED, RENTALS_DAMAGE_WINDOW, RENTALS_DAMAGE_NO_BASIS, RENTALS_DAMAGE_EXCEEDS_VALUE, RENTALS_DAMAGE_DUPLICATE | rentals.damage.claimed | yes (Idempotency-Key) |
| `rentals.damage.respond` | rentals.damage.respond | [statement classrup.rentals.damage_response/v1 signed by renter over the claim cid] { claimId, expectedRevision, claimCid, kind: accepted\|counter\|contest, counterAmount?, note? } | { claimId, revision, state, responseCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, VALIDATION_FAILED, RENTALS_DAMAGE_COUNTER_LIMIT | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.accept_counter` | rentals.damage.decide | [statement classrup.rentals.damage_counter_acceptance/v1 signed by owner over the response cid] { claimId, expectedRevision, responseCid } | { claimId, revision, agreedAmount: Money, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.withdraw` | rentals.damage.decide | [statement classrup.rentals.damage_withdrawal/v1 signed by owner] { claimId, expectedRevision } | { claimId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | rentals.damage.resolved | yes (Idempotency-Key) |
| `rentals.damage.escalate` | rentals.damage.escalate | [vault-local; requests F09.S02.M02 case with the claim, comparison and evidence; notice statement to the other party] { claimId, expectedRevision, statement } | { claimId, revision, disputeCaseId? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.damage.receive` | rentals.damage.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_DAMAGE_NO_BASIS, CONFLICT_STATE | rentals.damage.claimed, rentals.damage.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.damage.compare_reports` | rentals.damage.read_own | [vault-local] { reservationId } | { rows: [{ checklistItemId, handoffCondition, returnCondition, worsened: boolean, photoPairs[] }], worsenedItemIds[], eligible: boolean, windowEndsAt } | NOT_FOUND |
| `rentals.damage.get` | rentals.damage.read_own | [vault-local] { claimId } | { claim: DamageClaim, paymentProof?: none\|claimed\|acknowledged\|confirming\|final\|disputed\|expired } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.damage.claimed` | P2 | { claimId, reservationId, ownerId, renterId, kind, totalClaimed, claimCid } |
| `rentals.damage.resolved` | P2 | { claimId, reservationId, outcome, agreedAmount?, disputeCaseId? } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | store the attested handoff report cid as the baseline for comparisons |
| `rentals.return.attested` | open the 7 day claim window from the attestation time |
| `rentals.rental.overdue` | start the 14 day clock after which a not_returned claim is allowed |
| `rentals.rental.closed` | close the claim window; later claims return RENTALS_DAMAGE_WINDOW |
| `commerce.dispute.opened` | for context type rental_damage link the case id to the claim |
| `commerce.dispute.resolved` | move an escalated claim to resolved with the agreed amount and outcome |
| `commerce.payment.acknowledged` | for context type rental_damage record payment proof acknowledged |
| `commerce.payment.finalized` | for context type rental_damage record payment proof final |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role or referenced cid check failed; statement quarantined |
| RENTALS_DAMAGE_WINDOW | 409 | no | claim or response is outside its allowed window |
| RENTALS_DAMAGE_NO_BASIS | 422 | no | reports show no worsened or missing item, or the claimed basis differs from the recomputed one |
| RENTALS_DAMAGE_EXCEEDS_VALUE | 422 | no | total claimed is above the owner's declared value |
| RENTALS_DAMAGE_DUPLICATE | 409 | no | a claim of this kind already exists for the reservation |
| RENTALS_DAMAGE_COUNTER_LIMIT | 409 | no | only one counter is allowed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
owner vault: rentals.damage.compare_reports { "reservationId": "0192f500-0002-…" } -> worsenedItemIds ["tent-pole"], eligible true
rentals.damage.claim { "reservationId": "0192f500-0002-…", "kind": "damage", "ownerDeclaredValue": { "amount": "30000", "currency": "EUR" },
  "items": [{ "checklistItemId": "tent-pole", "description": "Bent pole", "estimatedCost": { "amount": "4500", "currency": "EUR" }, "evidenceRefs": ["0192f540-00a1-…"] }] }
renter: rentals.damage.respond { "kind": "counter", "counterAmount": { "amount": "2500", "currency": "EUR" } } -> countered; owner accept_counter -> accepted, agreedAmount EUR 25.00
agreed amount is settled from the funded deposit through rentals.deposit.claim_forfeit, or paid directly through a payment claim
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T06 | integration | PS-041-04.R01, PS-041-04.R03 | accept path with funded deposit; accept path without deposit | agreed amount triggers deposit forfeit prefill, or payment context; resolved emitted once |
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T08 | contract | PS-041-04.R01, PS-041-04.R03, PS-041-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
