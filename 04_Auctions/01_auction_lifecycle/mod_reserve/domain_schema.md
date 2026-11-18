# PS-035-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/01_auction_lifecycle/mod_reserve. **Parent:** [mod_reserve SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`auc` ulid), CTR-COM-001 (currency object), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-035-01.R01 | The reserve is an embedded attribute of the auction (`auc_`); it has no standalone entity ID. | MVP |
| PS-035-01.R02 | Fields: `reserve_minor` (decimal string ≥ 0; `"0"` is treated as no reserve), `currency` (equal to auction currency, CTR-COM-001 object), `reserve_state` ∈ {`UNSET`, `SET`, `MET`}, `set_by` (`acc_`, seller), `set_at_revision`, `change_count` (integer 0–5), `updated_at_utc`. | MVP |
| PS-035-01.R03 | Append-only reserve history (`reserve_change` rows): `auc_id`, `revision`, `old_minor`, `new_minor`, `actor`, `changed_at_utc`. Values are never published. | MVP |
| PS-035-01.R04 | Public projection exposes only `reserve_status` ∈ {`NONE`, `NOT_MET`, `MET`}, derived from `reserve_state` and the current high bid. | MVP |
| PS-035-01.R05 | Canonical owner of reserve values and history: F04.S01.M01 (this module). The close record stores `reserve_met` only (PS-034-01 R04). | MVP |

## Data / schema
```json
{"auc_id": "auc_01HZ...", "reserve_minor": "12000",
 "currency": {"kind": "fiat", "code": "EUR", "exponent": 2},
 "reserve_state": "SET", "set_by": "acc_01HZ...", "set_at_revision": 3,
 "change_count": 1, "updated_at_utc": "2026-12-02T10:00:00Z", "schema_version": "1.0.0"}
```
- Data classes: `reserve_minor` PRIVATE_PERSONAL (seller only); `reserve_status` PUBLIC; `set_by` PSEUDONYMOUS; history rows PRIVATE_PERSONAL.

## Commands / queries / events
Covered in PS-035-04. Schema ID: `auction.reserve` (1.0.0).

## States & transitions
Covered in PS-035-03.

## Validation & errors
Covered in PS-035-02.

## Authorization
Covered in PS-035-05.

## Failure, idempotency, concurrency, offline
Covered in PS-035-06.

## Privacy, retention, abuse
Covered in PS-035-07.

## Observability & budgets
Reserve write p95 ≤ 150 ms (ASSUMPTION).

## Tests
- TEST-PS-035-01-01 (unit): `reserve_minor` = "0" equals no reserve; leading zeros rejected otherwise.
- TEST-PS-035-01-02 (lint): no public schema includes `reserve_minor` or history rows.
- TEST-PS-035-01-03 (lint): every field has one CTR-PRV-001 class.

## Acceptance criteria
1. Public auction schema has `reserve_status` only (contract test).
2. History is append-only (integration test).
3. Currency equals auction currency (integration test).

## Assumptions & open decisions
- ASSUMPTION: `"0"` means no reserve.
- PROVISIONAL: D03 integer minor units (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
