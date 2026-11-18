# PS-041-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (amount, claim links), CTR-PRV-001 (classes, EXIF location rule), CTR-ID-001 (`dmg_` PENDING registry entry, proposed owner F05), CTR-SCH-001.

**Decision labels:** D06 signed statements only (PROVISIONAL, unapproved). D09 no custody (PROVISIONAL).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-01.R01 | One `dmg_` record may hold 1–20 line items (`line_items`), each with one category from the enum below. | MVP |
| PS-041-01.R02 | `amount_minor` per line and `total_minor` are decimal strings (CTR-COM-001 R02). `total_minor` equals the sum of lines. | MVP |
| PS-041-01.R03 | Each line with amount > 0 carries 1–10 `evidence_digests` (SHA-256 of photo or document bytes). | MVP |
| PS-041-01.R04 | Photos are stored with GPS and device-location EXIF removed before digest and storage (LOCATION_PRECISE never persisted). | MVP |
| PS-041-01.R05 | `baseline_handoff_id` (`hnd_`) is nullable; `null` sets `baseline_present = false`. | MVP |
| PS-041-01.R06 | No platform wallet, balance or payout field (CTR-COM-001 R01). | MVP |

## Data / schema
```json
{
  "damage_id": "dmg_<26>",
  "rental_id": "rnt_<26>",
  "reported_by": "acc_<26>",
  "against": "acc_<26>",
  "baseline_handoff_id": "hnd_<26> | null",
  "baseline_present": "boolean",
  "line_items": [{"line_id": "uint 1..20", "category": "scratch | dent | missing_part | stain | electronics | cleaning | late_return | other", "description": "string <= 280", "amount_minor": "decimal string", "evidence_digests": ["sha256 hex"]}],
  "total_minor": "decimal string",
  "currency": "CTR-COM-001 currency object",
  "deposit_id": "dep_<26> | null",
  "claim_ids": ["clm_<26>"],
  "status": "REPORTED | ACKNOWLEDGED | CONTESTED | ESCALATED | DISPUTED | RESOLVED | WITHDRAWN",
  "state_version": "integer >= 1",
  "schema_version": "1.0.0"
}
```
Data classes: amounts and refs FINANCIAL_EVIDENCE; `description` PRIVATE_PERSONAL; photo bytes held by F08 attachments (`att_`), this record stores digests only.

## Commands / queries / events
Not applicable; see PS-041-04.

## States & transitions
Status set defined in PS-041-03. This file fixes fields only.

## Validation & errors
Shape errors `SYS.REQUEST_MALFORMED` (400); line-limit and evidence rules in PS-041-02.

## Authorization
Field visibility per PS-041-05: amounts and status participant; `description` participant; `reported_by` and `against` participant.

## Failure, idempotency, concurrency, offline
`total_minor` recomputed server-side on every write; client totals are ignored.

## Privacy, retention, abuse
Amounts RET-EVD. Photo digests linked to `att_` deletion: digest kept, bytes deleted per RET-PRIV (365 days). Never federated.

## Observability & budgets
`damage_schema_reject_total{code}`.

## Tests
- TEST-PS-041-01-01 (unit): 20 lines valid; 21 lines rejected.
- TEST-PS-041-01-02 (unit): `total_minor` recomputed when a client sends a wrong total.
- TEST-PS-041-01-03 (integration): uploaded JPEG with GPS EXIF stored without GPS tags (byte check).
- TEST-PS-041-01-04 (lint): no custody-capable field.

## Acceptance criteria
1. Schema registered with owner F05 and digest (CTR-SCH-001 R02).
2. Zero GPS-bearing bytes in stored photos (TEST-PS-041-01-03).
3. TEST-PS-041-01-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D06 default, unapproved): signed statements; no automated damage verdict.
- ASSUMPTION: categories above are the MVP set (OPEN, F05).
- OPEN (F05): whether `late_return` lines are charged here or through a direct claim.
