# PS-041-01 — Domain schema: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-01.R01** A DamageClaim stores reservation, parties, kind, itemized amounts, evidence, the comparison basis, responses, dispute reference, outcome and state, with revision per CTR-ID-001.
- **PS-041-01.R02** Claims are P2 in both vaults, retained under RET-EVIDENCE, with integer minor units in the reservation currency per CTR-MNY-001.
- **PS-041-01.R03** Claim content is immutable once signed; a counter or withdrawal is a new signed statement referencing the claim cid.

## Specification

### DamageClaim

Schema `classrup.rentals.damage_claim/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation |
| ownerId | actorId — claimant and signer |
| renterId | actorId — respondent |
| kind | enum — damage \| missing_parts \| not_returned |
| items | ClaimItem[] — 1..10 items {checklistItemId?, description ≤ 300, estimatedCost: Money, evidenceRefs[] (1..5)} |
| totalClaimed | Money — sum of item costs; > 0; ≤ ownerDeclaredValue |
| ownerDeclaredValue | Money — owner's stated replacement value; ≤ 1 000 000 000 000 minor units |
| basis | object — {handoffReportCid, returnReportCid?, worsenedItemIds[], overdueMinutes?} |
| claimCid | string — sha256- cid of the signed damage_claim |
| response? | object — {kind: accepted \| counter \| contest, counterAmount?: Money, note? ≤ 1000, responseCid, respondedAtClaim} |
| agreedAmount? | Money — amount fixed by acceptance, accepted counter or dispute resolution |
| disputeCaseId? | uuidv7 — ref F09.S02.M02 DisputeCase |
| settlement? | object — {via: deposit_forfeit \| payment_claim \| none, contextId?, proof?} |
| outcome? | enum — accepted \| counter_accepted \| withdrawn \| dispute_for_owner \| dispute_for_renter \| dispute_split |
| state | enum — claimed \| countered \| escalated \| accepted \| resolved \| withdrawn |
| respondBy | timestamp — local receipt time of the claim plus 7 days |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- totalClaimed equals the sum of item costs and never exceeds ownerDeclaredValue.
- Unless kind is not_returned, basis.worsenedItemIds has at least one item.
- At most one claim per (reservationId, kind) exists in a vault.
- state accepted or resolved implies agreedAmount is set and not above totalClaimed.

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
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-01.R03, PS-041-02.R03 | claim with 2 items summing to total and one whose sum is off by 1 minor unit | first stored with claim cid; second RENTALS_DAMAGE_EXCEEDS_VALUE or VALIDATION_FAILED |
| TEST-PS-041-09.T12 | integration | PS-041-03.R01, PS-041-01.R03 | not_returned claim at day 13 and day 15 overdue | RENTALS_DAMAGE_WINDOW at day 13; allowed at day 15 with overdue history as basis |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-02.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
