# PS-014-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`par` prefix, registered: cycle participant slot), CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-014-01.R01 | A slot record `par_` is canonical here (B-06): owner F02.S01.M02. Other modules reference it by full ID only. | MVP |
| PS-014-01.R02 | Each cycle `cyc_` holds 2 to 6 slots (ASSUMPTION; N_MAX per D02). Slot indexes are 1..N, unique per cycle. | MVP |
| PS-014-01.R03 | Each slot binds one `acc_` (authorization only, never displayed) and one `prf_` view (displayed to counterparties). | MVP |
| PS-014-01.R04 | A slot stores a registered region cell only (LOCATION_COARSE). No coordinates, addresses or precise distance. | MVP |
| PS-014-01.R05 | One `acc_` holds at most one slot per `cyc_` (no self-trade). | MVP |

## Data / schema
```json
{ "par_id": "par_<26>", "cyc_id": "cyc_<26>", "slot_index": 1,
  "acc_id": "acc_<26>", "prf_ref": "prf_<26>",
  "role": "proposer|invitee",
  "status": "invited|accepted|declined|withdrawn|removed|expired",
  "region_cell_id": "string from registry | null",
  "invited_at": "RFC3339", "resolved_at": "RFC3339|null", "schema_version": "1.0.0" }
```
Classes: `acc_id` PRIVATE_PERSONAL (owner, authorization only); `prf_ref` PSEUDONYMOUS; `region_cell_id` LOCATION_COARSE (CTR-PRV-001 R04, K_MIN = 5 ASSUMPTION).

## Commands / queries / events
Defined in PS-014-04. Ordering by `status` revision (CTR-EVT-001 R02).

## States & transitions
Defined in PS-014-03. Only `status`, `resolved_at` and `region_cell_id` (before accept) change after insert.

## Validation & errors
Rules in PS-014-02 (`PARTY.*`).

## Authorization
Field visibility in PS-014-05: `acc_id` is never returned to any actor other than the system.

## Failure, idempotency, concurrency, offline
Insert of slots for one cycle is one transaction; partial cycle creation is never visible.

## Privacy, retention, abuse
Max data class LOCATION_COARSE. Retention in PS-014-07.

## Observability & budgets
Counts per status and per cycle size; no `acc_` or `prf_` labels.

## Tests
- TEST-PS-014-01-01 (unit): slot count bounds 2 and 6 enforced; 1 and 7 refused.
- TEST-PS-014-01-02 (unit): duplicate `acc_` in one cycle refused.
- TEST-PS-014-01-03 (privacy): serialized public view contains no `acc_id` and no coordinates.

## Acceptance criteria
1. Schema fixtures pass; `acc_id` absent from every counterparty-facing serialization.
2. Field classes match CTR-PRV-001 with zero unclassified fields.

## Assumptions & open decisions
- ASSUMPTION: 2–6 slots in MVP; `N_MAX` changes need a D02 decision.
- D05 PROVISIONAL (Dxx default, unapproved): region cells only; no precise location on slots.
