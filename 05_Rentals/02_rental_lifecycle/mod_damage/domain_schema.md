# PS-041-01 — Domain schema: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-01.R01** A DamageClaim stores reservation, parties, kind, itemized amounts, evidence, the comparison basis with provenance, the signed deadlines, responses, dispute reference and resolution, settlement, outcome and state, with revision per CTR-ID-001.
- **PS-041-01.R02** Claims are P2 in both vaults, retained under RET-EVIDENCE, with integer minor units in the reservation currency per CTR-MNY-001.
- **PS-041-01.R03** Claim content is immutable once signed; a counter or withdrawal is a new signed statement referencing the claim cid.

## Specification

### DamageClaim

Schema `classrup.rentals.damage_claim/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key (claimId) |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation |
| ownerId | actorId — claimant and signer |
| renterId | actorId — respondent |
| kind | enum — damage \| missing_parts \| not_returned |
| items | ClaimItem[] — 1..10 items {checklistItemId?, description ≤ 300, estimatedCost: Money, evidenceRefs[] (1..5 attachment or MediaBlob ids)} |
| totalClaimed | Money — sum of item costs; > 0; ≤ ownerDeclaredValue |
| ownerDeclaredValue | Money — copied from the agreed deposit terms declaredValue, or from the reservation's signed request when no deposit was agreed; never user input |
| basis | object — {handoffReportCid, returnConditionCid?, provenance: bilateral \| owner_only \| renter_only, conflictingReportCid?, worsenedItemIds[], overdueMinutes?} |
| claimCid | string — sha256- cid of the signed damage_claim |
| claimCreatedAt | timestamp — signed createdAt of the claim |
| respondBy | timestamp — signed in the claim; claimCreatedAt + 7 d + 72 h |
| response? | object — {kind: accepted \| counter \| contest, counterAmount?: Money, note? ≤ 1000, responseCid, createdAtClaim} |
| counterAnswerBy? | timestamp — signed in the counter; counter createdAt + 7 d + 72 h |
| agreedAmount? | Money — amount fixed by acceptance, accepted counter or a both-accepted dispute outcome |
| retainedFromDeposit? | Money — amount retained for this claim, from rentals.deposit.released with this damageClaimId |
| excessDealId? | uuidv7 — F09 Deal for contextRef {rental_damage, claimId} over agreedAmount minus retainedFromDeposit |
| disputeCaseId? | uuidv7 — ref F09.S02.M02 DisputeCase for contextRef {rental_damage, claimId} |
| disputeOpenerRole? | enum — owner \| renter |
| escalatedFrom? | enum — claimed \| countered \| escalation_due |
| disputeResolution? | enum — no_fault_close \| refund_claimed \| return_agreed \| enforcement_referral \| lapsed |
| frozenFrom? | enum — claimed \| countered |
| settlement? | object — {via: deposit_forfeit \| payment_claim \| none, contextRef?, proof?} |
| outcome? | enum — accepted \| counter_accepted \| withdrawn \| refund_claimed \| return_agreed \| dispute_unresolved |
| state | enum — claimed \| countered \| escalation_due \| escalated_pending \| escalated \| frozen \| accepted \| resolved \| resolved_unsettled \| withdrawn |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- totalClaimed equals the sum of item costs and never exceeds ownerDeclaredValue.
- Unless kind is not_returned, basis.worsenedItemIds has at least one item.
- At most one claim per (reservationId, kind) exists in a vault.
- state accepted or resolved implies agreedAmount is set and not above totalClaimed; state resolved_unsettled implies no agreedAmount.
- The excess Deal amount equals agreedAmount minus retainedFromDeposit and is never negative, so one damage is never recovered twice.

### Storage DDL

```sql
CREATE TABLE rentals_damage_claim (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reservation_id TEXT NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL,
  total_minor TEXT NOT NULL, currency TEXT NOT NULL, respond_by TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX rentals_damage_kind ON rentals_damage_claim(tenant_id, reservation_id, kind);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-02.R03 | claim with 2 items summing to the total, and one whose total is off by 1 minor unit | first stored with claim cid; second returns VALIDATION_FAILED |
| TEST-PS-041-09.T12 | integration | PS-041-03.R01, PS-041-01.R02 | not_returned claim at day 13 and day 15 overdue; not_returned claim at day 15 while an uncontested renter return report is held | RENTALS_DAMAGE_WINDOW at day 13; allowed at day 15 with overdue history as basis; RENTALS_DAMAGE_WINDOW while the report is uncontested |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-04.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |
| TEST-PS-041-09.T21 | unit | PS-041-01.R03 | modify a signed claim; counter and withdraw | signed bytes cannot change; the counter and withdrawal are new statements naming the claim cid |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
