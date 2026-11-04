# PS-043-01 — Domain schema: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-01.R01** A RentalReturn stores reservation, due time, grace, return report content with photo hashes, effective return time, late minutes and fee, attestation mode, closure checks and state, with revision per CTR-ID-001.
- **PS-043-01.R02** Returns are P2 in both vaults, retained under RET-EVIDENCE; the late fee is integer minor units per CTR-MNY-001 computed from terms copied into the reservation at confirmation.
- **PS-043-01.R03** Report revisions and attestations are immutable once signed and bind to the exact report cid.

## Specification

### RentalReturn

Schema `classrup.rentals.return/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| reservationId | uuidv7 — ref F05.S01.M01 RentalReservation; unique |
| handoffReportCid | string — cid of the attested handoff report to compare with |
| dueAt | timestamp — reservation endsAt |
| graceUntil | timestamp — dueAt plus graceMinutes (0..1440) |
| checklist | ChecklistItem[] — 0..30 items as in the handoff, with the condition at return |
| photos | PhotoRef[] — 0..20 items {attachmentId, sha256} |
| notes? | string — ≤ 1000 code points, plain text |
| reportCid? | string — cid of the signed return_report |
| returnedAtClaim? | timestamp — time stated by the signer of the report |
| effectiveReturnedAt? | timestamp — claim if within 72 h before local receipt time, else receipt time |
| attestedBy? | enum — both \| renter_only_silent_owner \| owner_only |
| conditionVerdict? | enum — matches_handoff \| differences_noted |
| lateMinutes | int — 0 or more, after grace |
| lateFee | Money — CTR-MNY-001; ≥ 0; ≤ cap; only decreasing by owner adjustment |
| lateFeeContext? | string — payment context id registered with the Deal |
| damageWindowEndsAt? | timestamp — attestation time plus 7 days |
| closureChecks | object — {damageWindowOver, noOpenDamageClaim, depositSettled, ownerWaivedDamage} |
| state | enum — due \| overdue \| awaiting_owner \| attested \| closed |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- lateFee is at most the capAmount in the reservation lateFeeTerms and never negative.
- state closed implies attested and all four closure checks true.
- effectiveReturnedAt is never earlier than local receipt time minus 72 hours.

### Storage DDL

```sql
CREATE TABLE rentals_return (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, reservation_id TEXT NOT NULL, due_at TEXT NOT NULL, grace_until TEXT NOT NULL,
  state TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX rentals_return_reservation ON rentals_return(tenant_id, reservation_id);
CREATE INDEX rentals_return_due ON rentals_return(state, grace_until);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-01.R03, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T06 | integration | PS-043-01.R03, PS-043-06.R02 | sweep runs twice across the grace boundary and across restart | one overdue event per vault; closure emitted once |
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02 | closure with open damage claim, funded deposit, damage window, owner waiver | closed only when all four checks pass; waiver ends the window early |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-02.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
