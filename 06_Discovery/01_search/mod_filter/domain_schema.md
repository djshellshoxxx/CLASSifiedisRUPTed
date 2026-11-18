# PS-044-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (LOCATION_COARSE cells, PRIVATE_PERSONAL saved searches), CTR-COM-001 (currency object), CTR-ID-001 (`sfl_` PENDING registry entry, proposed owner F06), CTR-SCH-001.

**Decision labels:** D05 geoprivacy PROVISIONAL (coarse region filters only). D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-01.R01 | A filter is a closed object with the facets in the schema below; unknown keys → `FILTER.FACET_UNKNOWN` (400). | MVP |
| PS-044-01.R02 | At most 12 active facets per filter and 8 keyword tokens. | MVP |
| PS-044-01.R03 | Price bounds are decimal strings in minor units of one currency; a filter with bounds in two currencies → `FILTER.PRICE_CURRENCY_MIXED`. | MVP |
| PS-044-01.R04 | `region_cells` holds 1–5 registered coarse cells (CTR-PRV-001 R04). Coordinates or addresses are never accepted. | MVP |
| PS-044-01.R05 | `filter_hash` = SHA-256 of JCS of the normalized filter (sorted arrays, NFKC-casefolded keywords). Equal meaning → equal hash. | MVP |
| PS-044-01.R06 | Saved search record holds an owner `acc_`, a normalized filter, `status`, `notify` (`off`, `daily`), `state_version`. | MVP |

## Data / schema
```json
{
  "filter": {
    "category": ["enum from F01 taxonomy, max 5"],
    "listing_type": ["enum, max 5"],
    "condition": ["enum, max 5"],
    "price_min_minor": "decimal string | null",
    "price_max_minor": "decimal string | null",
    "currency": "CTR-COM-001 currency object | null",
    "region_cells": ["registered cell id, max 5"],
    "available_from": "date | null", "available_to": "date | null",
    "keywords": ["string, max 8 tokens, max 100 chars total"],
    "sort": "relevance | newest | price_asc | price_desc"
  },
  "filter_hash": "64 hex",
  "saved_search": {"search_id": "sfl_<26>", "owner_ref": "acc_<26>", "status": "ACTIVE | PAUSED | DELETED", "notify": "off | daily", "state_version": "integer >= 1", "schema_version": "1.0.0"}
}
```
Data classes: saved searches PRIVATE_PERSONAL (ASSUMPTION: a saved query reveals interests). Region cells LOCATION_COARSE. Ad-hoc filters are not persisted.

## Commands / queries / events
Not applicable; see PS-044-04.

## States & transitions
See PS-044-03.

## Validation & errors
PS-044-02.

## Authorization
Saved searches visible to owner only (`self`).

## Failure, idempotency, concurrency, offline
Normalization is deterministic; the same filter from two devices produces one hash.

## Privacy, retention, abuse
Saved searches: RET-PRIV (365 days after last access) and deleted with account (RET-ACC grace). Ad-hoc filters: RET-EPH cache only. Never federated.

## Observability & budgets
`filter_schema_reject_total{code}`.

## Tests
- TEST-PS-044-01-01 (unit): unknown key rejected; 12 facets pass; 13 fail.
- TEST-PS-044-01-02 (golden): two equivalent filters with reordered arrays produce identical `filter_hash`.
- TEST-PS-044-01-03 (lint): no coordinate or address field.
- TEST-PS-044-01-04 (unit): NFKC keyword normalization vectors pass.

## Acceptance criteria
1. Schema registered with owner F06 and digest.
2. Equivalent filters hash identically (TEST-PS-044-01-02).
3. TEST-PS-044-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: saved searches classed PRIVATE_PERSONAL (OPEN, F10).
- PROVISIONAL (D05 default, unapproved).
- ASSUMPTION: no currency conversion inside filters; single currency per price bound.
