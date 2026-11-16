# PS-004-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`lst_`, `acc_`, `cas_`, `evt_`), CTR-EVT-001, CTR-SCH-001, CTR-PRV-001. **Pending:** PENDING CTR-LST-001 (listing aggregate schema, owner F01), PENDING CTR-REG-001 (region-cell registry).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-01.R01 | No publish table. Publish state is fields on the `lst_` aggregate, changed only by events with `aggregate_type = listing` under an `expected_revision` check. | MVP |
| PS-004-01.R02 | `state` ∈ {`draft`, `published`, `held_review`} in this module. `archived` and `expired` belong to mod_archive; this module treats them as not publishable (`PUB.INVALID_STATE`). | MVP |
| PS-004-01.R03 | `published_at` and `expires_at` are set only by a transition into `published`, server-set, UTC, millisecond precision. `expires_at = published_at + duration_days`. | MVP |
| PS-004-01.R04 | `region_cell` holds a registered cell ID only. It never holds a coordinate, street or postal address. | MVP |
| PS-004-01.R05 | `hold` is non-null iff `state = held_review`. `hold` holds a reason code and a time. No free text, moderator identity or case detail. | MVP |
| PS-004-01.R06 | `listing.published` payload max class ≤ LOCATION_COARSE. No PRIVATE_PERSONAL or higher field in any publish event. | MVP |

## Data / schema
```json
{
  "listing_id": "lst_<26> (ulid class, F01)",
  "owner_ref": "acc_<26> (PSEUDONYMOUS; owner view; public sees prf_ view only)",
  "revision": "integer >= 1 (PUBLIC)",
  "listing_kind": "open enum: sell | wanted | giveaway (PUBLIC)",
  "state": "enum: draft | published | held_review (PSEUDONYMOUS; non-published states owner-only)",
  "title": "string 1..120 UTF-8, trimmed (PUBLIC; PII scan at publish)",
  "price": "null | {amount_minor: decimal string ^(0|[1-9][0-9]{0,18})$, currency: ISO 4217, exponent: int 0..3} (PUBLIC, PROVISIONAL; null iff listing_kind = giveaway)",
  "region_cell": "registered cell ID; ASSUMPTION pattern ^[A-Z]{2}-[A-Z0-9]{2,3}-[A-Z0-9]{2,4}$ (LOCATION_COARSE)",
  "duration_days": "enum 7 | 14 | 30 | 60 | 90, default 30 (ASSUMPTION; PSEUDONYMOUS)",
  "published_at": "RFC3339 UTC ms | null (PUBLIC)",
  "expires_at": "RFC3339 UTC ms | null (PUBLIC)",
  "media_status": "enum none | pending | clean | rejected (PSEUDONYMOUS)",
  "hold": "null | {reason_code: enum risk_review | personal_data_suspected | media_review | report_open, placed_at: RFC3339 UTC ms} (PSEUDONYMOUS; owner view)",
  "schema_version": "1.0.0"
}
```

Provenance: every transition records `actor_ref` (`acc_` owner, `mod_` moderator, or `sys_` for server-internal transitions) and `provenance.source_kind` (CTR-EVT-001). Retention: listing record and publish events RET-ACC; hold reason on the listing until cleared (PS-004-07).

## Open points
- OPEN-1 `price` class. CTR-SCH-001 example classes `price` as FINANCIAL_EVIDENCE; CTR-FED-001 example emits `price` under max class PUBLIC. Default PUBLIC (PROVISIONAL, D03 unit rules; F10 must decide before approval).

## Assumptions & open decisions
- ASSUMPTION: `duration_days` set and default 30.
- PROVISIONAL (D05 default, unapproved): `region_cell` is a coarse registered cell.
- PROVISIONAL (D03 default, unapproved): money as integer minor units in decimal strings; no floats.
- PROVISIONAL (D07 default, unapproved): RET-ACC for listing fields.

## Tests
- TEST-PS-004-01-01 (schema): valid fixture passes; fixtures with float price, non-registered cell or coordinate in `region_cell` fail.
- TEST-PS-004-01-02 (lint): every field has one data class (CTR-PRV-001 R01); no SECRET class in event schemas.
- TEST-PS-004-01-03 (invariant): `hold` non-null iff `state = held_review`; `expires_at - published_at = duration_days` in ms.

## Acceptance criteria
1. Schema fixtures in TEST-PS-004-01-01 and -03 pass in CI.
2. OPEN-1 resolved by F10 before status moves past SPEC-DRAFT-COMPLETE.
3. No field outside the listed set is written by this module.
