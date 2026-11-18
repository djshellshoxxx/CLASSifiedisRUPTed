# PS-027-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001 (quote, currency), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-01.R01 | A valuation snapshot is keyed by (`cyc_` ID, `revision`). It has no standalone entity ID. Only one snapshot per key exists. | MVP |
| PS-027-01.R02 | Each item line has `par_id`, `item_ref` (`lst_` ID or local description ≤ 120 chars), `value_source` ∈ {`listing_reference`, `self_declared`}. | MVP |
| PS-027-01.R03 | Each line stores `declared_minor` (decimal string, integer minor units), `declared_currency` (CTR-COM-001 currency object), `quote_id` (`qte_`, required when currency ≠ reference currency). | MVP |
| PS-027-01.R04 | Each line stores `converted_minor` in reference-currency minor units, computed with the rounding policy pinned by F09.S03.M03. | MVP |
| PS-027-01.R05 | Snapshot stores per-party `net_minor` (unsigned) and `net_direction` ∈ {`owes`, `receives`, `balanced`}, plus `snapshot_hash` = SHA-256 of JCS(snapshot body). | MVP |
| PS-027-01.R06 | Snapshot `valid_until` = minimum `valid_until` across quotes used. | MVP |

## Data / schema
```json
{"cyc_id": "cyc_01HZ...", "revision": 4, "reference_currency": {"kind": "fiat", "code": "EUR", "exponent": 2},
 "items": [{"par_id": "par_01HZ...", "item_ref": "lst_01HZ...", "value_source": "listing_reference",
   "declared_minor": "12000", "declared_currency": {"kind": "fiat", "code": "EUR", "exponent": 2},
   "quote_id": null, "converted_minor": "12000"}],
 "per_party": [{"par_id": "par_01HZ...", "net_minor": "3500", "net_direction": "owes"}],
 "valid_until": "2026-11-18T10:00:00Z", "snapshot_hash": "<64 hex>", "schema_version": "1.0.0"}
```
- Data classes: values and quotes FINANCIAL_EVIDENCE once the revision is `DECLARED`; before that, PSEUDONYMOUS.
- Provenance: `value_source` is always recorded. `self_declared` values are never presented as market prices.

## Commands / queries / events
Covered in PS-027-04. Schema ID `valuation.snapshot` (version 1.0.0).

## States & transitions
Covered in PS-027-03.

## Validation & errors
Covered in PS-027-02.

## Authorization
Covered in PS-027-05.

## Failure, idempotency, concurrency, offline
Covered in PS-027-06.

## Privacy, retention, abuse
Covered in PS-027-07.

## Observability & budgets
Snapshot build for 16 items ≤ 50 ms p95 (ASSUMPTION).

## Tests
- TEST-PS-027-01-01 (unit): one line per `value_source`; `quote_id` required for cross-currency lines only.
- TEST-PS-027-01-02 (property): `snapshot_hash` is stable across key order and whitespace (JCS).
- TEST-PS-027-01-03 (lint): every field has one CTR-PRV-001 class.

## Acceptance criteria
1. Snapshot schema references CTR-COM-001 currency and quote definitions by `$ref`.
2. Only one snapshot per (`cyc_`, `revision`); duplicate insert rejected.
3. `value_source` present on 100% of lines.

## Assumptions & open decisions
- ASSUMPTION: maximum 16 item lines per snapshot.
- PROVISIONAL: pinned quotes, integer minor units and expiry follow D03 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
