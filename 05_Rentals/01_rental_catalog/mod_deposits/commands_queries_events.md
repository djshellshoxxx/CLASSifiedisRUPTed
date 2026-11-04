# PS-040-04 — Commands, queries and events: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-04.R01** All commands are vault commands; each one that the other party must rely on also produces a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-040-04.R02** One ingestion command applies inbound statements, deduplicates by cid and derives local events with actor.kind federated; failures are quarantined.
- **PS-040-04.R03** Payment status is derived only from F09 events whose context is a rental_deposit of this module; the module never creates or alters a PaymentClaim itself.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.deposit.propose` | rentals.deposit.propose | [statement classrup.rentals.deposit_terms/v1 signed by owner, E2E encrypted to renter] { reservationId, amount, declaredValue, method, dueBy? } | { depositId, termsCid, syncState } | NOT_FOUND, VALIDATION_FAILED, RENTALS_DEPOSIT_DUPLICATE, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `rentals.deposit.agree` | rentals.deposit.agree | [statement classrup.rentals.deposit_agreement/v1 signed by renter over the exact terms cid] { depositId, expectedRevision, termsCid } | { depositId, revision, agreementCid, paymentContext, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_DEPOSIT_TERMS_STALE, EXPIRED | rentals.deposit.agreed | yes (Idempotency-Key) |
| `rentals.deposit.withdraw` | rentals.deposit.withdraw | [vault-local plus note statement to the other party] { depositId, expectedRevision } | { depositId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `rentals.deposit.attest_release` | rentals.deposit.release | [statement classrup.rentals.deposit_release_attestation/v1 signed by owner; registers the return payment context with the Deal] { depositId, expectedRevision, releaseAmount } | { depositId, revision, releaseContext, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_DEPOSIT_WINDOW, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.deposit.claim_forfeit` | rentals.deposit.release | [statement classrup.rentals.forfeit_claim/v1 signed by owner, E2E encrypted to renter] { depositId, expectedRevision, amount, reason, damageClaimId?, evidenceRefs[] } | { depositId, revision, claimCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_FORFEIT_EXCEEDS_DEPOSIT, RENTALS_DEPOSIT_WINDOW, VALIDATION_FAILED | rentals.deposit.forfeit_claimed | yes (Idempotency-Key) |
| `rentals.deposit.respond_forfeit` | rentals.deposit.respond | [statement classrup.rentals.forfeit_response/v1 signed by renter over the claim cid] { depositId, expectedRevision, claimCid, response: accepted\|partial\|disputed, acceptedAmount? } | { depositId, revision, responseCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | rentals.deposit.released | yes (Idempotency-Key) |
| `rentals.deposit.dispute` | rentals.deposit.dispute | [vault-local; requests F09.S02.M02 case with the deposit evidence; notice statement to the other party] { depositId, expectedRevision, statement } | { depositId, revision, disputeCaseId? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.deposit.receive` | rentals.deposit.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_DEPOSIT_TERMS_STALE, CONFLICT_STATE | rentals.deposit.agreed, rentals.deposit.forfeit_claimed, rentals.deposit.released | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.deposit.get` | rentals.deposit.read_own | [vault-local] { depositId } | { deposit: DepositTerms, proof: none\|claimed\|acknowledged\|confirming\|final\|disputed\|expired } | NOT_FOUND |
| `rentals.deposit.get_for_reservation` | rentals.deposit.read_own | [vault-local] { reservationId } | { deposit?: DepositTerms } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.deposit.agreed` | P2 | { depositId, reservationId, ownerId, renterId, amount, method, termsCid, agreementCid } |
| `rentals.deposit.released` | P2 | { depositId, reservationId, outcome, releasedAmount, retainedAmount } |
| `rentals.deposit.forfeit_claimed` | P2 | { depositId, reservationId, amount, reason, claimCid } |
| `rentals.deposit.funded` | P2 | { depositId, reservationId, amount, proof } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.payment.claimed` | for context type rental_deposit show proof claimed (unverified) |
| `commerce.payment.acknowledged` | for funding context move agreed to funded; for release context move release_pending to released |
| `commerce.payment.finalized` | same as acknowledged for crypto payments with chain finality |
| `commerce.payment.expired` | show proof expired; funding stays unfunded; the release stays pending and can be disputed |
| `commerce.dispute.resolved` | leave disputed according to the resolution outcome |
| `rentals.reservation.cancelled` | expire unfunded terms, or move funded terms to release_pending for a full release |
| `rentals.return.attested` | start the 7 day owner decision clock |
| `rentals.damage.resolved` | prefill a forfeit claim amount from an accepted or resolved damage claim; the owner still signs the claim |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role or referenced cid check failed; statement quarantined |
| RENTALS_DEPOSIT_DUPLICATE | 409 | no | live deposit terms already exist for this reservation |
| RENTALS_DEPOSIT_TERMS_STALE | 409 | no | agreement names terms that are not current |
| RENTALS_FORFEIT_EXCEEDS_DEPOSIT | 422 | no | forfeit amount is higher than the funded deposit |
| RENTALS_DEPOSIT_WINDOW | 409 | no | release or forfeit is outside the allowed window after return |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
owner vault: rentals.deposit.propose { "reservationId": "0192f500-0002-…", "amount": { "amount": "10000", "currency": "EUR" },
  "declaredValue": { "amount": "30000", "currency": "EUR" }, "method": "cash" } -> { "depositId": "0192f510-0001-…", "termsCid": "sha256-Dt…" }
renter vault: rentals.deposit.agree { "termsCid": "sha256-Dt…" } -> paymentContext { "type": "rental_deposit", "id": "0192f510-0001-…" }
renter pays cash and records a claim; owner acknowledges it in F09 -> commerce.payment.acknowledged -> state funded
after return: owner rentals.deposit.attest_release { "releaseAmount": { "amount": "10000", "currency": "EUR" } } -> state release_pending until the renter acknowledges receipt
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T04 | integration | PS-040-03.R02, PS-040-04.R03 | payment claimed only, confirming only, expired, then acknowledged | funded only at acknowledged or final; proof labels follow COM-4 |
| TEST-PS-040-09.T07 | integration | PS-040-04.R01, PS-040-04.R02, PS-040-06.R01, PS-040-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on released with identical cids; duplicates skipped |
| TEST-PS-040-09.T08 | contract | PS-040-04.R01, PS-040-04.R02, PS-040-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-040-09.T12 | integration | PS-040-03.R01, PS-040-04.R03 | reservation cancelled after funding | deposit moves to release_pending; owner attests full release; released after renter acknowledges |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
