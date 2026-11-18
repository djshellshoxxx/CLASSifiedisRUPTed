# PS-037-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-02.R01 | Validate in fixed order: schema, bounds, referential (auction exists; each bid belongs to auction; each account placed a listed bid), rule version, dedupe. First failure wins. | MVP |
| PS-037-02.R02 | Reject `account_ids` with fewer than 2 or more than 20 entries, or duplicates, with `FRAUD.ACCOUNT_SET_INVALID` (400). | MVP |
| PS-037-02.R03 | Reject `rule_version` lower than the active minimum for that `rule_id` with `FRAUD.RULE_VERSION_STALE` (409). | MVP |
| PS-037-02.R04 | Duplicate signal (same dedupe key) returns HTTP 200 with the existing `signal_id`; no second row. | MVP |
| PS-037-02.R05 | Reject any `score` outside 0..100 with `FRAUD.SCORE_OUT_OF_RANGE`; never clamp silently. | MVP |

## Data / schema
Field rules are those in PS-037-01. Unknown fields are rejected (`additionalProperties: false`). `features` keys must match `^[a-z_]{1,32}$`.

## Commands / queries / events
Validation runs before any event is emitted; rejected commands emit `fraud.signal_rejected` only to the internal rule-audit stream, never to public events.

## States & transitions
Not applicable: validation is stateless. Case status checks use the guards in PS-037-03.

## Validation & errors
| Code | Retryable | Message key | Diagnostic (privacy-safe) |
|---|---|---|---|
| FRAUD.RULE_UNKNOWN | false | fraud.err.rule_unknown | rule_id not in enum |
| FRAUD.RULE_VERSION_STALE | false | fraud.err.rule_stale | version < minimum |
| FRAUD.ACCOUNT_SET_INVALID | false | fraud.err.accounts | count or duplicate failure (no IDs logged) |
| FRAUD.SCORE_OUT_OF_RANGE | false | fraud.err.score | bounds failure |
| FRAUD.AUCTION_NOT_FOUND | false | fraud.err.auction | referential failure |
| FRAUD.BID_NOT_IN_AUCTION | false | fraud.err.bid | referential failure |
| FRAUD.SIGNAL_DUPLICATE | false | fraud.info.duplicate | returns 200, not an error to clients |
| FRAUD.CASE_STATE_CONFLICT | true | fraud.err.retry | stale `version`; re-read then retry |

## Authorization
Validation runs after the capability check (`fraud.record`, PS-037-05). An unauthorized caller receives `CAP.DENIED`, not a validation error, so rule vocabulary is not disclosed.

## Failure, idempotency, concurrency, offline
Validation is deterministic and side-effect free; safe to retry. Offline: not applicable.

## Privacy, retention, abuse
Diagnostics never include account IDs, bid IDs or features. Validation logs keep error code and rule_id only.

## Observability & budgets
Count validation failures by code. Validation p95 <= 5 ms per signal.

## Tests
- TEST-PS-037-02-01 (unit): each code in the table is raised for its exact fixture.
- TEST-PS-037-02-02 (property): random account sets of size 0–30 with duplicates accepted only when size 2..20 and unique.
- TEST-PS-037-02-03 (integration): duplicate delivery of the same bid event returns 200 with the same `signal_id`.

## Acceptance criteria
1. Every error code has one row with retryability and message key.
2. Rejections never include account, bid or feature values in diagnostics.
3. Validation order is documented and tested with multi-fault fixtures.

## Assumptions & open decisions
- ASSUMPTION: rule vocabulary is disclosed to appellants but not to other bidders.
- PROVISIONAL (D07 default, unapproved): rejected-signal audit rows kept 30 days.
