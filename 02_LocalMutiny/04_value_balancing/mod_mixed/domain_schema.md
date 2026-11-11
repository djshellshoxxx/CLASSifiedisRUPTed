# PS-026-01 — Domain schema: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-01.R01** A CompensationLeg records payer, payee, kind (money or extra_item), positive amount in the settlement currency, status, due date and the F09 deal and payment claim references; it never records a balance or a paid flag.
- **PS-026-01.R02** Legs become part of the immutable revision snapshot, so their amounts are consented to on the exact revision hash; after commit their amounts and parties never change.
- **PS-026-01.R03** Money legs use integer minor units in the cycle settlement currency, with no further conversion and no rounding.
- **PS-026-01.R04** Status values mirror CTR-COM-001 and the UI labels them accordingly; a leg is settled only by payee acknowledgement (cash, external) or final chain confirmation (crypto).

## Specification

### CompensationLeg

Schema `classrup.mutiny.compensation_leg/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — trade_proposal \| cycle \| recovery_case |
| subjectId | uuidv7 — subject the leg offsets |
| kind | enum — money \| extra_item |
| payerId | did — participant who owes the compensation; differs from payeeId |
| payeeId | did — participant who is owed |
| amount | Money — CTR-MNY-001; > 0 and ≤ 1 000 000 000 000 minor units in the settlement currency; value of the extra item for extra_item |
| extraLegId? | uuidv7 — TradeLeg id carrying the extra item line when kind is extra_item |
| planBasis | enum — gap_plan \| manual |
| methods | array — 1..3 of cash \| crypto \| external, payer's proposed settlement methods |
| status | enum — proposed \| due \| claimed \| disputed \| settled \| waived \| expired \| withdrawn |
| dueAt? | timestamp — local commit time + 14 d; set when due |
| dealId? | uuid — F09.S01.M01 Deal opened when due; deterministic from contextRef {type: cycle_compensation, id: cycleId or recoveryCaseId} |
| obligationId? | string — obligation of the Deal; equals the compensationLegId |
| contextCid? | cid — head revision contentHash, or cid of the accepting recovery_action statement for recovery legs |
| paymentClaimId? | uuidv7 — F09.S01.M01 PaymentClaim created by the payer's claim |
| claimMethod? | enum — cash \| crypto \| external |
| claimRef? | string — ≤ 128 chars, transaction reference or note given by the payer |
| claimStatusLabel? | enum — claimed_unverified \| acknowledged_by_payee \| confirmed_on_chain \| final \| disputed \| expired — mirrors CTR-COM-001 labels |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- payerId differs from payeeId and both are participants of the subject.
- A money leg amount is in the subject's settlement currency and never below 1 minor unit.
- status settled implies the linked PaymentClaim is acknowledged (cash or external) or final (crypto), or, for extra_item, that the carrying TradeLeg has a valid receiver attestation.
- Amount, payer, payee and kind never change after the leg is referenced by a sealed revision.

### Storage DDL

```sql
CREATE TABLE mutiny_compensation_leg (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, payer_id TEXT NOT NULL, payee_id TEXT NOT NULL,
  status TEXT NOT NULL, due_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX mutiny_compensation_subject ON mutiny_compensation_leg(tenant_id, subject_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T01 | unit | PS-026-01.R01, PS-026-01.R03, PS-026-03.R01 | planner on 3-party fixture | legs p2 to p1 4000 and p2 to p3 2000, all residuals zero |
| TEST-PS-026-09.T02 | property | PS-026-01.R03, PS-026-02.R03 | random value vectors for 2..8 participants | sum of payments conserved, at most N-1 legs, residuals within tolerance, deterministic output |
| TEST-PS-026-09.T04 | unit | PS-026-01.R01, PS-026-04.R01 | planner with an acceptedImbalances entry of the head snapshot covering one gap | that participant omitted and fewer legs produced |
| TEST-PS-026-09.T07 | integration | PS-026-01.R04, PS-026-02.R03 | crypto claim without verifier | stays claimed, never settled; cycle cannot complete; recovery waiver path available |
| TEST-PS-026-09.T15 | e2e | PS-026-01.R04, PS-026-07.R02 | mobile payer and payee flow | status labels as text; notice that no funds are held; axe zero serious issues |
| TEST-PS-026-09.T17 | integration | PS-026-03.R01, PS-026-01.R04 | crypto claim with a configured verifier reaching final | commerce.payment.finalized for the claim settles the leg with via final; cycle completion can proceed |
| TEST-PS-026-09.T20 | integration | PS-026-07.R01, PS-026-01.R02 | relay fixture records every mailbox put during claim and Deal statements | mailbox contents are ciphertext only and metadata is limited to recipient mailbox id, size and time |
| TEST-PS-026-09.T21 | unit | PS-026-01.R02, PS-026-02.R01 | change amount or payer of a leg sealed by the head revision after commit | refused with CONFLICT_STATE (V10); leg unchanged; consented digest still matches |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
