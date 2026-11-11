# PS-040-01 — Domain schema: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-01.R01** DepositTerms stores reservation, parties, amount, declared value, method, due time, agreement consent, funding and release Deals, release and forfeit details, dispute link, outcome and state, with revision per CTR-ID-001.
- **PS-040-01.R02** DepositTerms are P2 in both vaults, retained under RET-EVIDENCE, and money values are integer minor units in one currency per CTR-MNY-001.
- **PS-040-01.R03** Terms are immutable after proposal; a change is a new proposal that supersedes the old one, and agreement binds to the exact terms cid.

## Specification

### DepositTerms

Schema `classrup.rentals.deposit_terms/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (depositId) |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation; unique among non-terminal terms |
| ownerId | actorId — proposer and holder of the deposit |
| renterId | actorId — payer |
| amount | Money — CTR-MNY-001; > 0; ≤ declaredValue; same currency as the rent |
| declaredValue | Money — equals the declaredValue the renter signed in the rental request; > 0; ≤ 1 000 000 000 000 minor units |
| method | enum — cash \| external \| crypto |
| dueBy | timestamp — default reservation startsAt; at most startsAt and at most proposal time + 75 days so the funding Deal expiry (≤ 90 days) covers it |
| termsCid | string — sha256- cid of the signed deposit_terms statement |
| agreementCid? | string — cid of the renter's comms.consent statement {subjectType rentals_deposit, subjectRef depositId, subjectRevisionHash of termsCid, statementKey consent.rentals.deposit.agree.v1} |
| agreementRevocationId? | string — revocationId of the comms.consent.revoked whose revokedIds[] named agreementCid |
| withdrawalCid? | string — cid of a deposit_withdrawal (owner withdrawal or renter decline) |
| fundingDealId? | uuid — UUIDv8 per F09.S01.M01 (explicit CTR-ID-001 ID-1 exception, derived from contextRef and contextCid); F09 Deal for contextRef {rental_deposit, depositId} |
| fundingClaimId? | uuidv7 — ref F09 PaymentClaim for the deposit payment |
| fundedAt? | timestamp — local time when proof became acknowledged or final |
| returnAttestedAtClaim? | timestamp — signed attestation time from rentals.return.attested |
| overdueSince? | timestamp — detectedAt of rentals.rental.overdue |
| damageClaims | object[] — 0..3 {claimId, kind} recorded from rentals.damage.claimed, with resolvedAt, outcome and agreedAmount? from rentals.damage.resolved |
| forfeit? | object — {amount: Money, reason: damage \| missing_parts \| late_return \| not_returned \| other, damageClaimId? (required for damage and missing_parts, and for not_returned when a not_returned damage claim is recorded), evidenceRefs[] (1..10 attachment or blob ids), claimCid, respondBy (signed: createdAt + 14 d + 72 h), responseCid?, response?: accepted \| partial \| disputed, acceptedAmount?} |
| releaseAttestationCid? | string — cid of the owner's deposit_release_attestation |
| releaseDealId? | uuid — UUIDv8 per F09.S01.M01 (explicit CTR-ID-001 ID-1 exception, derived from contextRef and contextCid); F09 Deal for contextRef {rental_deposit_release, depositId} |
| releaseClaimId? | uuidv7 — ref F09 PaymentClaim from owner to renter for the amount to be returned |
| releaseAmount? | Money — amount to be returned, fixed by the path that entered release_pending |
| retainedAmount? | Money — amount the owner keeps after an accepted forfeit or a both-accepted dispute outcome |
| outcome? | enum — released_full \| released_partial \| retained_full \| not_funded |
| disputeCaseId? | uuidv7 — ref F09.S02.M02 DisputeCase for contextRef {rental_deposit, depositId} |
| disputeOpenerRole? | enum — owner \| renter |
| disputedFrom? | enum — funded \| release_pending \| forfeit_claimed \| escalation_due |
| disputeResolution? | enum — no_fault_close \| refund_claimed \| return_agreed \| enforcement_referral \| lapsed |
| frozenFrom? | enum — proposed \| agreed \| funded \| release_pending \| forfeit_claimed |
| decisionDueAt? | timestamp — returnAttestedAtClaim plus 7 days (soft decision clock) |
| decisionOverdue | boolean — funded, decisionDueAt passed and no release attestation or forfeit claim, or set by a dispute that ended without an agreed outcome |
| state | enum — proposed \| agreed \| funded \| release_pending \| forfeit_claimed \| escalation_due \| escalated_pending \| disputed \| frozen \| released \| forfeited \| withdrawn \| expired |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- state funded or later implies agreementCid is set and funding proof under fundingDealId was acknowledged or final.
- retainedAmount plus releaseAmount equals the funded amount whenever both are set.
- forfeit.amount is at most the funded amount, and at most one forfeit references any damage claim.
- state forfeited implies the renter's signed acceptance of retaining the full funded amount (a forfeit_response or a both-accepted dispute outcome), never silence or a mediator-only outcome.
- The platform never holds funds - every money movement is a PaymentClaim under a Deal whose contextRef is {rental_deposit, depositId} or {rental_deposit_release, depositId}.

### Storage DDL

```sql
CREATE TABLE rentals_deposit_terms (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reservation_id TEXT NOT NULL, owner_id TEXT NOT NULL, renter_id TEXT NOT NULL,
  amount_minor TEXT NOT NULL, currency TEXT NOT NULL, state TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX rentals_deposit_live ON rentals_deposit_terms(tenant_id, reservation_id) WHERE state NOT IN ('released','forfeited','withdrawn','expired');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T01 | unit | PS-040-01.R01, PS-040-01.R02, PS-040-01.R03, PS-040-02.R03 | propose, supersede with new terms, agree on old cid | second proposal supersedes; agreement on old cid RENTALS_DEPOSIT_TERMS_STALE; amounts immutable |
| TEST-PS-040-09.T05 | property | PS-040-01.R02, PS-040-03.R02, PS-040-09.R02 | random partial forfeits, forfeits claimed below the deposit and accepted in full, releases, and two damage claims | retained plus released equals funded; an accepted forfeit below the funded amount goes to release_pending with funded − amount, never forfeited; at most one forfeit per damage claim; integer minor units |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-04.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody wording shown and signed; axe zero serious issues |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
