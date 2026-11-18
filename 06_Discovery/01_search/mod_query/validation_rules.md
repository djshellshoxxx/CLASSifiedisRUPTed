# PS-046-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R02, R05, R07), CTR-ID-001 (R09), CTR-PRV-001 (R05).

**Decision labels:** Token limits are ASSUMPTION (F14 and F15 to validate). No Dxx directly applies.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-02.R01 | Reject `text` with more than 200 code points as `QUERY.TEXT_TOO_LONG`. | MVP |
| PS-046-02.R02 | Reject more than 16 tokens as `QUERY.TOO_MANY_TOKENS`; reject any token over 32 code points as `QUERY.TOKEN_TOO_LONG`. | MVP |
| PS-046-02.R03 | Reject `region_scope` of length 0 or > 5, or any unregistered cell, as `QUERY.CELL_REQUIRED` / `QUERY.TOO_MANY_CELLS` / `QUERY.UNKNOWN_CELL`. | MVP |
| PS-046-02.R04 | Reject `page_size` outside 1–50 as `QUERY.PAGE_SIZE_RANGE`. | MVP |
| PS-046-02.R05 | Reject an unknown `sort`, or `sort` values reserved for Future, as `QUERY.INVALID_SORT`. | MVP |
| PS-046-02.R06 | Reject a cursor that fails HMAC, is expired or is bound to a different request digest as `QUERY.INVALID_CURSOR`. | MVP |
| PS-046-02.R07 | Reject bidi-override or control code points in `text` as `QUERY.INVALID_CHARACTERS`. | MVP |

## Data / schema
| Rule | Field | Check | Code | Retryable |
|---|---|---|---|---|
| V1 | text | ≤ 200 code points | QUERY.TEXT_TOO_LONG | false |
| V2 | text tokens | ≤ 16, each ≤ 32 | QUERY.TOO_MANY_TOKENS / QUERY.TOKEN_TOO_LONG | false |
| V3 | region_scope | 1–5 registered cells | QUERY.CELL_REQUIRED / TOO_MANY_CELLS / UNKNOWN_CELL | false |
| V4 | page_size | 1–50 | QUERY.PAGE_SIZE_RANGE | false |
| V5 | sort | enum, MVP values only | QUERY.INVALID_SORT | false |
| V6 | cursor | HMAC, TTL 10 min, digest bound | QUERY.INVALID_CURSOR | false |
| V7 | text | no bidi or control chars | QUERY.INVALID_CHARACTERS | false |

## Commands / queries / events
Validation runs before the query executes and before any rate-limit counter increments on invalid input (invalid requests do not consume budget).

## States & transitions
Failed validation moves request to `rejected` (PS-046-03).

## Validation & errors
Envelope per CTR-ERR-001 R01. `details[].field` is a JSON pointer; input values are never echoed (R07). Client message keys: `err.query.text_too_long`, etc.

## Authorization
Validation precedes authorization only for syntax; cell existence is checked after authorization to avoid cell-enumeration oracle (see PS-046-05).

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic.

## Privacy, retention, abuse
Rejected text is not logged. Only code and request_id are logged (CTR-ERR-001 R10).

## Observability & budgets
Counter `query_validation_reject_total{code}`. Spike alert at 5% of requests over 10 min (ASSUMPTION).

## Tests
- TEST-PS-046-02-01 (unit): each rule V1–V7 has pass and fail fixture.
- TEST-PS-046-02-02 (property): random Unicode text never passes with bidi overrides.
- TEST-PS-046-02-03 (security): tampered cursor (bit flip, expired, wrong digest) yields QUERY.INVALID_CURSOR for each.

## Acceptance criteria
1. Every code in V1–V7 returned with the specified retryable value.
2. Invalid requests do not increment the rate-limit counter (test asserts).
3. Error responses echo no input value (static check).

## Assumptions & open decisions
- ASSUMPTION: 16-token and 32-code-point token caps (F14 to validate for CJK and long compounds).
