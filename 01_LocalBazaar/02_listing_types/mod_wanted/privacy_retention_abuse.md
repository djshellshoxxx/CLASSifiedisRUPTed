# PS-007-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention classes, disclosure matrix, R05 query budget, R10 notification previews), CTR-CAP-001, CTR-FED-001 (R02, R08), CTR-ERR-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-07.R01 | No stored field of class LOCATION_PRECISE, PRIVATE_PERSONAL or SECRET. Enforced by PS-007-01 schema and PS-007-02 text rules. | MVP |
| PS-007-07.R02 | Drafts are PRIVATE_PERSONAL and visible to the owner only. Published content is PUBLIC. | MVP |
| PS-007-07.R03 | Retention follows the table below. Purge jobs report counts only and are tested. | MVP |
| PS-007-07.R04 | Abuse controls (rate, duplicate, contact-in-text, scam-pattern review) are active before publish. Scam-pattern matches go to F12 review, not automatic ban. | MVP |
| PS-007-07.R05 | Owner delete propagates to index, caches and federation tombstones within 24 h (CTR-PRV R06). | MVP |
| PS-007-07.R06 | Push and notification text is generic ("A wanted post changed status"). Post content is never previewed by default (CTR-PRV R10). | MVP |

## Data / schema
| Data | Class | Default retention | Basis |
|---|---|---|---|
| Published content (title, description, category, budget, `region_cell`) | PUBLIC / LOCATION_COARSE | Until expiry, close, fulfil or delete. Body kept 90 days, then purged to tombstone | D07 PROVISIONAL |
| Draft | PRIVATE_PERSONAL | Purged after 30 days without edit | ASSUMPTION |
| Tombstone (ID, revision, reason, time) | PSEUDONYMOUS | ≥ 90 days beyond max envelope expiry | RET-FED |
| Moderation snapshot | per case | 24 months; personal fields redacted after 12 months | RET-EVD |
| Idempotency records | PSEUDONYMOUS | 7 days | RET-OPS |
| Audit (`aud_`) | PSEUDONYMOUS | 12 months | RET-AUD |
| Owner account deletion | — | Owner posts tombstoned within 30-day grace | RET-ACC |

## Commands / queries / events
Tombstone emits `listing.tombstoned` (CTR-FED R07). Retention jobs emit no content.

## States & transitions
Retention purges run outside the state machine. A purged item is `tombstoned` first. Moderation holds (RET-LEGAL) block purge.

## Validation & errors
Rejections use PS-007-02 codes. Abuse-driven rejections use `WANTED.DUPLICATE_ACTIVE`, `ACTIVE_LIMIT_REACHED`, `CONTACT_IN_TEXT`, or `SYS` rate-limit code. No reason detail beyond the rule enum.

## Authorization
Only the owner can delete, export or see drafts. Moderators see posts only under a case. Location queries follow the budget in CTR-PRV R05 (30 per 24 h).

## Failure, idempotency, concurrency, offline
Purge jobs are idempotent by `id` and retention class. A failed purge retries; it never deletes early.

## Privacy, retention, abuse
Abuse controls (ASSUMPTION thresholds):
| Control | Threshold | Action |
|---|---|---|
| Creates per `acc_` | 10 per hour | `SYS` rate-limit code |
| Active posts per `acc_` | 5 | `ACTIVE_LIMIT_REACHED` |
| Duplicate | same title and category, 24 h | `DUPLICATE_ACTIVE` |
| Contact or address in text | pattern match | `CONTACT_IN_TEXT` / `PRECISE_LOCATION_IN_TEXT` |
| Advance-fee or deposit-first wording | keyword plus risk score ≥ threshold | `review`: draft to `suspended`, F12 case |
| Read scraping per principal | 60 list calls per minute | `SYS` rate-limit code |

Logs never contain title, description, budget or raw `owner_account_id`.

## Observability & budgets
Counters `wanted_abuse_decision_total{decision}`, `wanted_retention_purged_total{class}`. No per-owner metrics.

## Tests
- TEST-PS-007-07-01 (integration): draft purged at day 31, not day 29.
- TEST-PS-007-07-02 (integration): owner delete reaches index and removes listing within 24 h; tombstone present.
- TEST-PS-007-07-03 (fixture): contact fixtures blocked (cross-ref TEST-PS-007-02-03).
- TEST-PS-007-07-04 (abuse): 11th create in one hour is rate limited.
- TEST-PS-007-07-05 (log scan): no title, description or budget in logs.
- TEST-PS-007-07-06 (contract): push preview text is generic.

## Acceptance criteria
1. Retention table implemented with a purge test per class.
2. Log scan finds zero personal or content fields.
3. Scam-pattern matches reach F12 review and never auto-ban.
4. D07 default labelled PROVISIONAL in all surfaces.

## Assumptions & open decisions
- D07 PROVISIONAL (Dxx default, unapproved): minimal per-category retention with legal-hold exceptions.
- D05 PROVISIONAL (Dxx default, unapproved): coarse region only; precise location never stored.
- ASSUMPTION: all abuse thresholds; F10 Privacy Lead and F12 Trust & Safety Lead to confirm.
