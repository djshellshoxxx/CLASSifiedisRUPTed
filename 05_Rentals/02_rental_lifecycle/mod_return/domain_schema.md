# PS-043-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, coarse cells), CTR-ID-001 (`rtn_` PENDING registry entry, proposed owner F05), CTR-SCH-001, CTR-EVT-001 (`aggregate_type = rental_return`).

**Decision labels:** D07 retention PROVISIONAL (unapproved). Late-charge policy OPEN (F05).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-01.R01 | One `rtn_` per rental, created when the rental reaches its end time. Second insert → `RETURN.ALREADY_DECLARED`. | MVP |
| PS-043-01.R02 | `late_minutes` is a non-negative integer computed by the server as `max(0, declared_at − due_at)` in minutes. Client values ignored. | MVP |
| PS-043-01.R03 | `return_place_cell` is a registered coarse cell or null; no coordinates or addresses (CTR-PRV-001 R03). | MVP |
| PS-043-01.R04 | `renter_checklist` uses the handoff checklist codes (`accessories_complete`, `visible_condition_recorded`, `identifier_recorded`, `access_items_returned`) with `ok`, `issue`, `not_applicable`. | MVP |
| PS-043-01.R05 | `damage_ids` links to `dmg_` records (owned by F05.S02.M03); this record stores no amounts. | MVP |
| PS-043-01.R06 | No payment, balance or custody field (CTR-COM-001 R01). | MVP |

## Data / schema
```json
{
  "return_id": "rtn_<26>",
  "rental_id": "rnt_<26>",
  "renter_ref": "acc_<26>",
  "owner_ref": "acc_<26>",
  "due_at": "RFC 3339",
  "declared_at": "RFC 3339 | null",
  "late_minutes": "integer >= 0",
  "return_place_cell": "string | null",
  "renter_checklist": [{"code": "enum", "result": "ok | issue | not_applicable"}],
  "renter_note": "string <= 500 | null",
  "owner_result": "NO_ISSUE | ISSUE_REPORTED | null",
  "owner_confirmed_at": "RFC 3339 | null",
  "damage_ids": ["dmg_<26>"],
  "status": "DUE | OVERDUE | DECLARED | OWNER_CONFIRMED | DAMAGE_OPEN | CLOSED",
  "closed_reason": "BOTH_CONFIRMED_NO_ISSUE | DAMAGE_RESOLVED | OWNER_WINDOW_CLOSED | CANCELLED | null",
  "state_version": "integer >= 1",
  "schema_version": "1.0.0"
}
```
Data classes: `renter_note` PRIVATE_PERSONAL; `late_minutes`, status PRIVATE_PERSONAL; `return_place_cell` LOCATION_COARSE.

## Commands / queries / events
Not applicable; see PS-043-04.

## States & transitions
See PS-043-03.

## Validation & errors
See PS-043-02.

## Authorization
Renter and owner read; non-participants `SYS.NOT_FOUND` (PS-043-05).

## Failure, idempotency, concurrency, offline
`late_minutes` recomputed on every read path; stored value is the value at declaration.

## Privacy, retention, abuse
Retention RET-PRIV (365 days after last access); held while a linked damage or deposit dispute is open. Never federated.

## Observability & budgets
`return_schema_reject_total{code}`.

## Tests
- TEST-PS-043-01-01 (unit): one record per rental; second insert rejected.
- TEST-PS-043-01-02 (unit): client-supplied `late_minutes` is overwritten by the server value.
- TEST-PS-043-01-03 (lint): no coordinate or amount field in schema.
- TEST-PS-043-01-04 (integration): `damage_ids` accept only `dmg_` IDs.

## Acceptance criteria
1. Schema registered with owner F05 and digest.
2. Zero amount fields (TEST-PS-043-01-03).
3. TEST-PS-043-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: checklist codes mirror handoff codes for comparison.
- OPEN (F05): whether late minutes feed any charge.
