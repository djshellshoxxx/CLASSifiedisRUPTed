# PS-001-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes, retention table, disclosure matrix), CTR-FED-001 (R02 federation scope, R07 tombstones), CTR-CAP-001 (case scope), CTR-EVT-001 (R11, R13), CTR-ID-001 (R07). Pseudonyms do not guarantee anonymity (parent SPEC).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-07.R01 | Non-owners cannot tell that a listing is archived: they receive `SYS.NOT_FOUND`. | MVP |
| PS-001-07.R02 | For moderator archives the owner sees only `MODERATION_HOLD` as reason. The owner never sees `archive_case_ref`. | MVP |
| PS-001-07.R03 | Archive records hold no LOCATION_PRECISE data and no free text. | MVP |
| PS-001-07.R04 | Archive state is exported to peers only when `federate=true`. Archive of a federated listing exports an update, not a tombstone (tombstones are for deletion, CTR-FED-001 R07). | Future |
| PS-001-07.R05 | Toggle abuse: 10 accepted transitions per listing per 24 h. Excess → `ARCHIVE.TRANSITION_RATE_LIMITED`. | MVP |
| PS-001-07.R06 | Restore keeps `published_at`. Archive and restore cannot bump search ranking. | MVP |
| PS-001-07.R07 | Archived listings leave search, caches and recommendation feeds within 60 s p95 (ASSUMPTION). | MVP |

## Data / schema
| Record | Class | Retention | Basis |
|---|---|---|---|
| Archive fields on `lst_` | PSEUDONYMOUS | RET-ACC (account lifetime + 30 days) | PROVISIONAL (D07 default, unapproved) |
| `listing.archived`, `listing.restored` | PSEUDONYMOUS | RET-AUD (12 months) | CTR-PRV-001 |
| Moderator-archive `aud_` record | PSEUDONYMOUS | RET-AUD; RET-LEGAL if `cas_` is held | CTR-PRV-001 R07 |
| Idempotency records | PSEUDONYMOUS | RET-OPS (7 days) | PS-001-06 |
| Client pending queue | PSEUDONYMOUS | RET-EPH; purged on ack, logout, account switch | CTR-PRV-001 |

Listing deletion propagates to replicas and caches within 24 h (CTR-PRV-001 R06). This module does not own listing deletion.

## Commands / queries / events
Event privacy: `max_data_class` PSEUDONYMOUS (PS-001-04). No `acc_` in federated payloads (CTR-EVT-001 R13).

## States & transitions
Abuse limits apply on the transitions in [workflow_state_machine.md](workflow_state_machine.md) (R03).

## Validation & errors
Error responses carry no case ID, account ID or input value (CTR-ERR-001 R06).

## Authorization
Case scope for moderator data; matrix in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Retention purge is idempotent and reruns safely. Queue purge on logout is required before a new session starts (CTR-PRV-001 S3-10 rule).

## Privacy, retention, abuse
| Threat | Control |
|---|---|
| Enumerating archived listings | Identifiers are not secrets; access by visibility rule (CTR-ID-001 R07); same response for missing and hidden. |
| Ranking manipulation | R05, R06 |
| Owner learns moderator details | R02 |
| Scraping archive status | query rate limit (PS-001-08 budgets) |
| Replay of old archive command | idempotency window and state guard (PS-001-06) |
| Stalking by archive timing | public views show day granularity only (ASSUMPTION) |

## Observability & budgets
Logs and metrics pseudonymous only (CTR-PRV-001 R09); see [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-001-07-01 — privacy: non-owner receives identical body for missing and archived listing.
- TEST-PS-001-07-02 — privacy: owner view of moderator archive has no `archive_case_ref`.
- TEST-PS-001-07-03 — abuse: 11th toggle in 24 h rejected.
- TEST-PS-001-07-04 — retention: RET-ACC purge removes archive fields after account lifetime + 30 days.

## Acceptance criteria
1. Retention and class table matches CTR-PRV-001 defaults, or any change cites a recorded decision (Dxx) and the F10 review.
2. No test fixture exposes a case ID to the owner view.
3. Federated export of archived listing contains no owner `acc_` (test fixture).

## Assumptions & open decisions
- PROVISIONAL (D05 default, unapproved): no precise location in archive records.
- PROVISIONAL (D07 default, unapproved): retention defaults above; jurisdiction review OPEN (CTR-PRV-001 R07).
- ASSUMPTION: 60 s de-index budget; day-granular public timestamps.
- F10 review of this file is a future gate, not claimed.
