# PS-046-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R04), CTR-CAP-001 (R04); PENDING CTR-DSC-001.

**Decision labels:** Cursor TTL is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-03.R01 | Request states: `received`, `validated`, `executed`, `returned`, `rejected`, `rate_limited`. Terminal: `returned`, `rejected`, `rate_limited`. | MVP |
| PS-046-03.R02 | Execution reads one consistent index snapshot per request (single read revision). | MVP |
| PS-046-03.R03 | Pagination chain holds a snapshot token bound to index revision for 10 min; later pages do not show documents removed after the first page. | MVP |
| PS-046-03.R04 | A request exceeding 2 s execution time returns `QUERY.TIMEOUT` (retryable true). | MVP |

## Data / schema
Snapshot token = HMAC over (`request digest`, `snapshot_revision`, `issued_at`). Stored nowhere; carried in cursor.

## Commands / queries / events
Lifecycle applies to `discovery.search` (PS-046-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| received | validate ok | V1–V7 pass | validated | none |
| received | validate fail | any | rejected | error envelope |
| validated | authorize ok, budget ok | — | executed | read snapshot |
| validated | budget exhausted | — | rate_limited | SYS.RATE_LIMITED with retry-after |
| executed | results ready | ≤ 2 s | returned | page + next cursor |
| executed | timeout | > 2 s | rejected | QUERY.TIMEOUT |
| returned | next page requested | cursor valid | executed | snapshot reused |

## Validation & errors
Rejected transitions carry codes from PS-046-02 or SYS.RATE_LIMITED / QUERY.TIMEOUT.

## Authorization
Authorization evaluated between `validated` and `executed` (PS-046-05).

## Failure, idempotency, concurrency, offline
Concurrent identical requests do not share state. Timeout leaves no partial page.

## Privacy, retention, abuse
Snapshot tokens expire in 10 min; no server-side session state for paging.

## Observability & budgets
Histogram `query_state_duration_ms{state}`; p95 execution ≤ 150 ms (ASSUMPTION).

## Tests
- TEST-PS-046-03-01 (unit): each row of the table.
- TEST-PS-046-03-02 (integration): removal between page 1 and page 2 does not reappear on page 2 within snapshot.
- TEST-PS-046-03-03 (load): timeout path returns QUERY.TIMEOUT at 2 s with no partial body.

## Acceptance criteria
1. All transitions above covered by tests.
2. Snapshot consistency test passes across 1 000 random removals.
3. Timeout returns no partial items.

## Assumptions & open decisions
- ASSUMPTION: 10 min snapshot TTL (F15 to validate).
