# PS-063-10 — import export backup rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R11, R12), CTR-SCH-001 (R07, R08), CTR-EVT-001 (R08)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-10.R01 | Export gives each party their own offers, counters and terms in JSON within 24 h. | MVP |
| PS-063-10.R02 | Export excludes other party's identifiers beyond the pseudonymous ref already in the party's own offer. | MVP |
| PS-063-10.R03 | Offer records are signed-evidence-grade (CTR-SCH-001 R08): stored bytes unchanged, lossy migrations forbidden. | MVP |
| PS-063-10.R04 | Restore never reopens an expired offer or re-accepts a withdrawn one. | MVP |
| PS-063-10.R05 | Kill switch `offers.create.enabled` disables new offers; accept/decline/withdraw remain available until in-flight offers expire. | MVP |
| PS-063-10.R06 | Money fields are never migrated by floating-point conversion; migrations are string-preserving. | MVP |

## Data / schema
Export: `{"export_id":"…","offers":[{"offer_id":"ofr_…","version":2,"counter_of":"…","terms":{…},"state":"…","expires_at":"…"}],"schema_version":"1.0.0"}`.

## Commands / queries / events
`offer.exported` event (IDs and counts only).

## States & transitions
Export job: `requested` → `building` → `ready` (24 h) → `expired`.

## Validation & errors
`OFFERS.EXPORT_NOT_READY` (412, retryable); `OFFERS.EXPORT_EXPIRED` (410).

## Authorization
Self-scope export ([PS-063-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Export idempotent per (party, day). Restore re-checks `expires_at` against server time.

## Privacy, retention, abuse
Exports are FINANCIAL_EVIDENCE: authenticated download only, deleted 24 h after expiry. Backups encrypted.

## Observability & budgets
Alert on restore producing an `open` offer past `expires_at`.

## Tests
- TEST-PS-063-10-01 (export): own offers present; third-party data absent.
- TEST-PS-063-10-02 (restore): backup taken before expiry, restored after → offer `expired`, not `open`.
- TEST-PS-063-10-03 (money): export and re-import preserve `amount_minor` as strings, byte for byte.
- TEST-PS-063-10-04 (kill switch): `offers.create.enabled` off → create refused; accept still works on existing offer.

## Acceptance criteria
1. Export contains no third-party amounts (TEST-PS-063-10-01).
2. Money round-trip exact (TEST-PS-063-10-03).

## Assumptions & open decisions
- D07 (retention): PROVISIONAL (D07 default, unapproved).
- OPEN: portability format for compensation items referencing `lst_` (default: ID only).
