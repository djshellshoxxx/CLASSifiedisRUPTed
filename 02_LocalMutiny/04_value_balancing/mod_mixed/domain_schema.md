# PS-026-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001 (claim, quote), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-01.R01 | A compensation leg is a sub-object of a `cyc_` revision, addressed by (`cyc_` ID, `revision`, `leg_index` 1–8). It has no standalone entity ID; it becomes a `clm_` claim only on `clm.submit`. | MVP |
| PS-026-01.R02 | `kind` ∈ {`cash`, `bank_transfer`, `onchain_transfer`, `external_card`, `in_kind_compensation`, `other_external`}, identical to the CTR-COM-001 `method` enum. No other value. | MVP |
| PS-026-01.R03 | `amount_minor` is a base-10 decimal string, no leading zeros, > 0, ≤ 999999999999999 (ASSUMPTION). Floats are rejected. | MVP |
| PS-026-01.R04 | `currency` is a CTR-COM-001 currency object. If it differs from the proposal's agreed currency, `quote_id` (`qte_`) is required. | MVP |
| PS-026-01.R05 | Each leg stores `from_par`, `to_par` (`par_` IDs) and `valuation_snapshot_hash` (SHA-256 from PS-027-01). | MVP |
| PS-026-01.R06 | `in_kind_compensation` stores `description` ≤ 280 characters, class PRIVATE_PERSONAL. `amount_minor` is then a reference value only (CTR-COM-001 R03). | MVP |

## Data / schema
```json
{"leg_index": 1, "kind": "cash", "from_par": "par_01HZ...", "to_par": "par_01HZ...",
 "amount_minor": "25000", "currency": {"kind": "fiat", "code": "EUR", "exponent": 2},
 "quote_id": null, "valuation_snapshot_hash": "<64 hex>", "due_by": "2026-12-31T00:00:00Z",
 "declared_by": "acc_01HZ...", "declared_at": "2026-11-18T09:00:00Z", "leg_status": "DECLARED"}
```
- Leg rows are append-only per revision. Any change creates a new revision (see PS-026-06).
- Data classes: amounts, currency, `due_by`, `kind` = FINANCIAL_EVIDENCE; `from_par`, `to_par`, `declared_by` = PSEUDONYMOUS; `description` = PRIVATE_PERSONAL.
- Provenance: `declared_by` plus `declared_at` (server time). Claim fields after submit are owned by F09 (CTR-COM-001).

## Commands / queries / events
Covered in PS-026-04. Schema IDs: `mixed.leg.v1` (leg payload, schema_version 1.0.0 per CTR-SCH-001).

## States & transitions
Covered in PS-026-03.

## Validation & errors
Covered in PS-026-02.

## Authorization
Covered in PS-026-05.

## Failure, idempotency, concurrency, offline
Covered in PS-026-06.

## Privacy, retention, abuse
Covered in PS-026-07.

## Observability & budgets
Schema validation of a full 8-leg revision: ≤ 5 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-026-01-01 (unit): each `kind` value accepted; any other string rejected.
- TEST-PS-026-01-02 (property): `amount_minor` regex accepts `0` only where `kind` is `in_kind_compensation`.
- TEST-PS-026-01-03 (lint): schema registry entry exists and every field has one CTR-PRV-001 class.

## Acceptance criteria
1. Schema matches CTR-COM-001 `method` and `currency` definitions by `$ref`, not by copy.
2. Every field carries one data class; lint passes.
3. Leg sub-object cannot be updated in place (append-only check in TEST-PS-026-01-03).

## Assumptions & open decisions
- ASSUMPTION: maximum 8 legs per revision; maximum amount 10^15 − 1 minor units.
- PROVISIONAL: integer minor units and quote expiry follow D03 default (unapproved).
- OPEN: whether a leg may reference an external `trx_` directly. See [DECISIONS.md](../../../DECISIONS.md) D03, D04.
