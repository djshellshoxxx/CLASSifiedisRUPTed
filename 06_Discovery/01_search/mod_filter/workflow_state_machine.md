# PS-044-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (owner scope).

**Decision labels:** Notification cadence ASSUMPTION. D07 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-03.R01 | Ad-hoc filter evaluation has no persistent state. | MVP |
| PS-044-03.R02 | Saved-search status set exactly ACTIVE, PAUSED, DELETED. DELETED is terminal. | MVP |
| PS-044-03.R03 | `notify = daily` sends at most one digest per 24 h per saved search (ASSUMPTION). | MVP |
| PS-044-03.R04 | Pausing or deleting stops digests within 1 h. | MVP |
| PS-044-03.R05 | Other transitions → `FILTER.INVALID_TRANSITION` (409). | MVP |

## Data / schema
`state_version` increments per event; status not updated in place.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | saved_search.saved | owner, quota (R07 in PS-044-02) | ACTIVE | Schedule digest |
| ACTIVE | saved_search.paused | owner | PAUSED | Stop digest |
| PAUSED | saved_search.resumed | owner | ACTIVE | Start digest |
| ACTIVE, PAUSED | saved_search.deleted | owner | DELETED | Purge digests; retention per PS-044-07 |

## States & transitions
Terminal: DELETED.

## Validation & errors
`FILTER.INVALID_TRANSITION` (409), non-retryable.

## Authorization
Owner only.

## Failure, idempotency, concurrency, offline
Digest job idempotent per `(search_id, digest_date)`. Revision check on writes.

## Privacy, retention, abuse
History is retained with the saved search; deletion removes it within 24 h (CTR-PRV-001 R06).

## Observability & budgets
`saved_search_transitions_total{from,to}`; digest sends counter.

## Tests
- TEST-PS-044-03-01 (state): every table row passes; others return R05.
- TEST-PS-044-03-02 (digest): two digest jobs for one day send one digest.
- TEST-PS-044-03-03 (pause): no digest 1 h after pause.
- TEST-PS-044-03-04 (delete): deleted search never digests again.

## Acceptance criteria
1. DELETED is terminal (TEST-PS-044-03-01).
2. No duplicate digests (TEST-PS-044-03-02).
3. Pause and delete take effect within 1 h.

## Assumptions & open decisions
- ASSUMPTION: daily digest only in MVP.
