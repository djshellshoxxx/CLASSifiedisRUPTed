# PS-040-01 — Domain schema: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-01.R01** DepositTerms stores reservation, parties, amount, declared value, method, due time, agreement, funding, release and forfeit details, outcome and state, with revision per CTR-ID-001.
- **PS-040-01.R02** DepositTerms are P2 in both vaults, retained under RET-EVIDENCE, and money values are integer minor units in one currency per CTR-MNY-001.
- **PS-040-01.R03** Terms are immutable after proposal; a change is a new proposal that supersedes the old one, and agreement binds to the exact terms cid.

## Specification

### DepositTerms

Schema `classrup.rentals.deposit_terms/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation; unique among non-terminal terms |
| ownerId | actorId — proposer and holder of the deposit |
| renterId | actorId — payer |
| amount | Money — CTR-MNY-001; > 0; ≤ declaredValue; same currency as the rent |
| declaredValue | Money — owner's stated replacement value; > 0; ≤ 1 000 000 000 000 minor units |
| method | enum — cash \| external \| crypto |
| dueBy | timestamp — claim by the owner; default reservation startsAt; at most startsAt |
| termsCid | string — sha256- cid of the signed deposit_terms statement |
| agreementCid? | string — cid of the deposit_agreement signed by the renter over termsCid |
| fundingClaimId? | uuidv7 — ref F09 PaymentClaim for the deposit payment |
| fundedAt? | timestamp — local time when proof became acknowledged or final |
| forfeit? | object — {amount: Money, reason: damage \| missing_parts \| late_return \| not_returned \| other, damageClaimId?, evidenceRefs[] (≤ 10), claimCid, responseCid?, response?: accepted \| partial \| disputed, acceptedAmount?} |
| releaseClaimId? | uuidv7 — ref F09 PaymentClaim from owner to renter for the amount to be returned |
| releaseAmount? | Money — amount to be returned; amount minus retained |
| retainedAmount? | Money — amount the owner keeps after an accepted or resolved forfeit |
| outcome? | enum — released_full \| released_partial \| retained_full |
| disputeCaseId? | uuidv7 — ref F09.S02.M02 DisputeCase |
| decisionDueAt? | timestamp — return attestation time plus 7 days |
| state | enum — proposed \| agreed \| funded \| release_pending \| forfeit_claimed \| disputed \| released \| forfeited \| withdrawn \| expired |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- state funded or later implies agreementCid is set and funding proof is acknowledged or final.
- retainedAmount plus releaseAmount equals the funded amount whenever both are set.
- forfeit.amount is at most the funded amount.
- The platform never holds funds - every money movement is a PaymentClaim between owner and renter with a context reference to this record.

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
| TEST-PS-040-09.T05 | property | PS-040-01.R02, PS-040-03.R02 | random partial forfeits and releases | retained plus released equals funded; never above funded; integer minor units |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-02.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody notice shown; axe zero serious issues |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
