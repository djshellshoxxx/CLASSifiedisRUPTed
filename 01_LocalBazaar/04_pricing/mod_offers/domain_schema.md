# PS-011-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001 (quote and money fields). PENDING CTR-ID-001 registry row for the offer prefix.

**Canonical owner of record class `offer`:** F08.S02.M01, [08_Communications/02_negotiation/mod_offers](../../../08_Communications/02_negotiation/mod_offers/SPEC.md) (PS-063-01). PROVISIONAL (lead to confirm; no CONTRACTS.md entry). This module defines only the price-offer fields below and holds no second persisted copy. Consumers reference offers by full ID.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-01.R01 | One price offer = one buyer's proposed amount for one listing in state open. One record per accepted submission. | MVP |
| PS-011-01.R02 | Stored fields are exactly those in Data / schema. Unknown input field → SYS.REQUEST_MALFORMED. | MVP |
| PS-011-01.R03 | Amounts are integer minor units as decimal strings, max 39 digits, no leading zeros. No float field exists. | MVP |
| PS-011-01.R04 | Offer has no free-text field in MVP. Count of such fields = 0 (static schema lint). | MVP |
| PS-011-01.R05 | `expires_at` ≤ `created_at` + 14 days (ASSUMPTION). | MVP |
| PS-011-01.R06 | Listing price and currency are snapshotted at submit and never updated afterwards. | MVP |
| PS-011-01.R07 | Offer ID prefix `ofr` (PENDING CTR-ID-001), opaque class (private timing). | MVP |
| PS-011-01.R08 | No platform balance, payout, custody or payment-status field exists (COM.CUSTODY_FORBIDDEN). | MVP |
| PS-011-01.R09 | Multi-round price negotiation (counter-offers) is out of scope. | Future |

## Data / schema
| Field | Type | Class | Constraints and provenance |
|---|---|---|---|
| offer_id | `ofr_` ID, 30 chars | PSEUDONYMOUS | Server-generated; client may supply for offline replay (D08) |
| listing_id | `lst_` ID | PUBLIC | Must reference an open listing (F01) |
| buyer_ref | `acc_` ID | PSEUDONYMOUS | Taken from authenticated principal only (CTR-CAP-001 R11) |
| seller_ref | `acc_` ID | PSEUDONYMOUS | Snapshot of listing owner at submit; relation re-derived per decision |
| amount_minor | decimal string | PRIVATE_PERSONAL | Integer minor units, ≥ 1 |
| currency | object: kind (fiat/asset), code, exponent 0–18 | PRIVATE_PERSONAL | Equals listing currency, or pinned by quote_id |
| listing_amount_minor | decimal string | PUBLIC | Snapshot of ask at submit |
| quote_id | `qte_` ID or null | PRIVATE_PERSONAL | Required iff currency differs from listing; valid at commit (CTR-COM-001 R04, D03) |
| status | closed enum: submitted, accepted, rejected, withdrawn, expired, superseded | PRIVATE_PERSONAL | `draft` exists only on client (D08) |
| expires_at | RFC 3339 UTC, ms | PRIVATE_PERSONAL | See R05 |
| created_at, updated_at, terminal_at | RFC 3339 UTC, ms | PRIVATE_PERSONAL | Server-set (CTR-EVT-001 R04) |
| revision | integer ≥ 1 | PSEUDONYMOUS | Per aggregate (CTR-EVT-001 R02) |
| schema_version | "1.0.0" | PUBLIC | CTR-SCH-001 |

Provenance: `client_direct` or `client_offline_replay` for submissions; `server_internal` for expiry and supersede.

## Commands / queries / events
Not defined here. See [commands_queries_events.md](commands_queries_events.md) (PS-011-04).

## States & transitions
Not defined here. See [workflow_state_machine.md](workflow_state_machine.md) (PS-011-03).

## Validation & errors
Field rules in [validation_rules.md](validation_rules.md) (PS-011-02).

## Authorization
Field visibility in [authorization_capabilities.md](authorization_capabilities.md) (PS-011-05).

## Failure, idempotency, concurrency, offline
Not defined here. See PS-011-06.

## Privacy, retention, abuse
Data classes above are binding. Retention and abuse controls in PS-011-07.

## Observability & budgets
Not defined here. See PS-011-08.

## Tests
- TEST-PS-011-01-01 (lint): schema has exactly the fields above; no free-text or location field.
- TEST-PS-011-01-02 (unit): amount decimal-string pattern accepts `0` only where rejected by R01 of PS-011-02; rejects floats and leading zeros.
- TEST-PS-011-01-03 (contract): every field carries one CTR-PRV-001 class (CTR-PRV-001 R01).
- TEST-PS-011-01-04 (lint): no field typed as integer for an entity ID (CTR-ID-001 TEST-08).

## Acceptance criteria
1. Schema lint passes with fields and classes exactly as listed.
2. Field table has zero float, free-text and location fields.
3. Canonical owner and PENDING items recorded in the module SPEC.

## Assumptions & open decisions
- PROVISIONAL (D03 default, unapproved): quotes pinned, integer minor units, expiry ≤ 15 min after observation.
- PROVISIONAL (D08 default, unapproved): drafts local until server acknowledgement.
- PROVISIONAL (D09 default, unapproved): no platform custody; accepted offer is an agreement record only.
- ASSUMPTION: 14-day maximum offer lifetime.
- OPEN: canonical owner of `offer` (F08 chosen, PROVISIONAL; F01 is the alternative).
