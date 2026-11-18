# PS-106-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-07.R01 | Inbox items store `object_ref` and category only; no object text, names or counterparties. | MVP |
| PS-106-07.R02 | `group_key` is an HMAC; the mapping key is held by F16 and rotated every 90 days (ASSUMPTION). | MVP |
| PS-106-07.R03 | Item retention is the user's `retention_days` (max 365) and never beyond RET-ACC. | MVP |
| PS-106-07.R04 | Items from blocked or quarantined accounts are not projected (F12 blocklist reference). | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| inbox_preference | PSEUDONYMOUS | RET-ACC |
| inbox item (ntf_ projection) | PSEUDONYMOUS | min(retention_days, 365) |
| group_key | PSEUDONYMOUS (non-reversible) | with item |

## Commands / queries / events
No content in events (PS-106-04.R04).

## States & transitions
Account deletion removes all items within deletion SLA.

## Validation & errors
No personal data in error responses.

## Authorization
Owner only; see authorization_capabilities.

## Failure, idempotency, concurrency, offline
Deletion job idempotent.

## Privacy, retention, abuse
- Abuse: inbox flooding from many sources; per-source rate limit and per-object dedupe within 24 h.
- Abuse: harassment by repeated mentions; blocked accounts filtered at projection (R04).
- Privacy: inbox size leaks activity volume; accepted as residual risk, listed in Privacy Lead review.

## Observability & budgets
Metrics without account labels.

## Tests
- TEST-PS-106-07-01 (contract): projected item has no fields beyond schema.
- TEST-PS-106-07-02 (integration): blocked sender yields no projection.
- TEST-PS-106-07-03 (integration): deletion removes items within SLA.
- TEST-PS-106-07-04 (property): HMAC key rotation keeps dedupe within 24 h window only.

## Acceptance criteria
1. Schema scan passes.
2. Block filter verified.
3. Retention verified.

## Assumptions & open decisions
- ASSUMPTION: 90-day HMAC rotation.
- D07 PROVISIONAL (D07 default, unapproved).
