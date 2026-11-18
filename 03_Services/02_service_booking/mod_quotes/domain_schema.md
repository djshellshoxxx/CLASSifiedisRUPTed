# PS-032-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (PENDING `svq` prefix), CTR-COM-001 (currency object; `trx_` on accept), CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-01.R01 | Record type `svq` (service quote), ID `svq_<26 base32>`, class ulid. Prefix `svq` is PENDING CTR-ID-001 registration (owner F03). The prefix `qte_` is not used: it is reserved for pinned currency quotes (CTR-COM-001). | MVP |
| PS-032-01.R02 | Fields: `srv_id`, `provider` (`acc_`), `customer` (`acc_`, set on accept or on targeted send), `avw_ids` (array, 1–8), `price_minor` (decimal string > 0), `currency` (CTR-COM-001 object), `tax_mode` ∈ {`inclusive`, `exclusive`, `not_applicable`}, `line_items` (1–20), `scope_text` (≤ 2000 chars), `valid_until`, `status`, `revision`, `price_hash`. | MVP |
| PS-032-01.R03 | `line_items[]` = {`label` ≤ 120 chars, `amount_minor` decimal string ≥ 0}. Sum must equal `price_minor` exactly. | MVP |
| PS-032-01.R04 | `price_hash` = SHA-256 of JCS(quote body without `price_hash`). Customer acceptance binds to this hash. | MVP |
| PS-032-01.R05 | On accept, the quote stores `trx_id` (CTR-COM-001 transaction ID created by F09). No payment field exists on `svq`. | MVP |

## Data / schema
```json
{"svq_id": "svq_01HZ...", "srv_id": "srv_01HZ...", "provider": "acc_01HZ...", "customer": "acc_01HZ...",
 "avw_ids": ["avw_01HZ..."], "price_minor": "45000",
 "currency": {"kind": "fiat", "code": "EUR", "exponent": 2}, "tax_mode": "inclusive",
 "line_items": [{"label": "Labour, 3 h", "amount_minor": "45000"}],
 "scope_text": "Replace kitchen tap, parts included.", "valid_until": "2026-11-25T18:00:00Z",
 "status": "SENT", "revision": 2, "price_hash": "<64 hex>", "trx_id": null, "schema_version": "1.0.0"}
```
- Data classes: `scope_text` PRIVATE_PERSONAL; price, currency, line items FINANCIAL_EVIDENCE once SENT; `provider`, `customer` PSEUDONYMOUS.
- Accepted quotes are immutable (PS-032-03).

## Commands / queries / events
Covered in PS-032-04. Schema IDs: `svcquote.quote` (1.0.0).

## States & transitions
Covered in PS-032-03.

## Validation & errors
Covered in PS-032-02.

## Authorization
Covered in PS-032-05.

## Failure, idempotency, concurrency, offline
Covered in PS-032-06.

## Privacy, retention, abuse
Covered in PS-032-07.

## Observability & budgets
Quote write ≤ 200 ms p95 including hold call (ASSUMPTION).

## Tests
- TEST-PS-032-01-01 (unit): `line_items` sum equals `price_minor` at 0, 1 and 20 items.
- TEST-PS-032-01-02 (property): `price_hash` stable under key reordering (JCS).
- TEST-PS-032-01-03 (lint): no payment or wallet field exists on `svq`.

## Acceptance criteria
1. Schema references CTR-COM-001 currency by `$ref`.
2. `svq` prefix registration filed (PENDING CTR-ID-001) before implementation.
3. Accepted quote row is immutable (lint and integration test).

## Assumptions & open decisions
- ASSUMPTION: maximum 8 availability windows per quote; 20 line items.
- PENDING CTR-ID-001: `svq` prefix. PROVISIONAL: integer minor units and pinned currency per D03 default (unapproved). See [DECISIONS.md](../../../DECISIONS.md).
