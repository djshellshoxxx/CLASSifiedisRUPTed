# PS-001-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes R01–R02, retention table, disclosure matrix), CTR-FED-001 (R02 federation scope, R07 tombstones), CTR-CAP-001 (case scope), CTR-EVT-001 (R11, R13). **Decisions:** D05, D07 (defaults PROVISIONAL, unapproved). Pseudonyms do not guarantee anonymity (parent SPEC).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-07.R01 | Archive does not disclose to the public that a listing was archived. Non-owners receive `SYS.NOT_FOUND`. | MVP |
| PS-001-07.R02 | Moderator archive reason and case ID are visible only to the owner's view as a generic state, never the case ID. Case ID is visible in case scope only. | MVP |
| PS-001-07.R03 | Archive records contain no LOCATION_PRECISE data and no free text (PS-001-01 R04). | MVP |
| PS-001-07.R04 | Archive status is absent from federation exports unless `federate=true`. Archive of a federated listing exports an update, not a tombstone (tombstones are for deletion, CTR-FED-001 R07). | Future |
| PS-001-07.R05 | Toggle abuse: 10 accepted transitions per listing per 24 h (PS-001-03 R03). Excess → `ARCHIVE.TRANSITION_RATE_LIMITED`. | MVP |
| PS-001-07.R06 | Restore keeps `published_at`. Archive/restore cannot be used to bump search ranking. | MVP |
| PS-001-07.R07 | Archived listings are excluded from search, caches and recommendation feeds within 60 s p95 (ASSUMPTION). | MVP |

## Data classes and retention
| Record | Class | Retention | Basis |
|---|---|---|---|
| Archive fields on `lst_` | PSEUDONYMOUS | RET-ACC (account lifetime + 30 days) | D07 default, CTR-PRV-001 |
| `listing.archived` / `listing.restored` events | PSEUDONYMOUS | RET-AUD (12 months) | CTR-PRV-001 audit class |
| Moderator archive `aud_` record | PSEUDONYMOUS | RET-AUD; under legal hold if `cas_` is held (RET-LEGAL) | CTR-PRV-001 R07 |
| Idempotency records | PSEUDONYMOUS | RET-OPS (7 days) | PS-001-06 |
| Client pending queue | PSEUDONYMOUS | RET-EPH (purged on ack, purged on logout) | CTR-PRV-001 |

Deletion of the listing by its owner propagates to all replicas and caches within 24 h (CTR-PRV-001 R06). This module does not own listing deletion.

## Abuse and threats
| Threat | Control |
|---|---|
| Enumeration of archived listings by ID | Opaque-free IDs are not secrets; access is by visibility rule (CTR-ID-001 R07), not by ID. Same response for missing and hidden. |
| Ranking manipulation by toggling | R05 and R06 |
| Owner learns moderator details | R02 |
| Bot scraping archive status | Rate limit on queries (PS-001-08 budget) |
| Replay of old archive command | Idempotency window and state guard (PS-001-06) |
| Stalking through archive timing | Timestamps are coarse in public views (day granularity, ASSUMPTION) |
