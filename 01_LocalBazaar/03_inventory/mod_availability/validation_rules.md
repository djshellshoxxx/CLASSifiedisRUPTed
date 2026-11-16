# PS-008-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-SCH-001, CTR-CAP-001.

**Decisions:** Numeric limits are ASSUMPTION (unapproved). Offline queueing of configure and commit requests follows D08 default (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-02.R01 | Every rule below runs server-side before any write. Client-side checks are advisory only. | MVP |
| PS-008-02.R02 | Rules run in order: format (V02), then state (V03–V09), then limits (V10–V11). First failure returns; no partial write. | MVP |
| PS-008-02.R03 | Diagnostics carry field path and rule enum only. Input values are never echoed (CTR-ERR-001 R07). | MVP |

## Rules
| Rule | Input | Check | Error code | Field rule |
|---|---|---|---|---|
| V01 | `availability.create` | listing kind ∈ {sell, giveaway} | AVAIL.NOT_APPLICABLE | `listing_kind_excluded` |
| V02 | `total_units`, `units`, `ttl_hours` | integers; `total_units` 0–10000; `units` ≥ 1 | AVAIL.UNITS_OUT_OF_RANGE | `units_range` |
| V03 | `hold.place` | `status` = ACTIVE | AVAIL.NOT_HOLDABLE | `status_forbids` |
| V04 | `hold.place` | `units` ≤ available_units | AVAIL.INSUFFICIENT_UNITS | `exceeds_available` |
| V05 | `availability.configure` | `total_units` ≥ held + committed | AVAIL.TOTAL_BELOW_COMMITTED | `below_committed` |
| V06 | `hold.place` | `ttl_hours` 1–168 | AVAIL.TTL_OUT_OF_RANGE | `ttl_range` |
| V07 | `hold.place` | caller is `sys_` of F01.S04.M01; holder ≠ owner | AVAIL.SELF_HOLD_FORBIDDEN | `self_hold` |
| V08 | `hold.withdraw`, `hold.execute` | hold state = PLACED | AVAIL.HOLD_NOT_ACTIVE | `hold_state` |
| V09 | `hold.execute` | `expires_at` > now | AVAIL.HOLD_EXPIRED | `hold_expired` |
| V10 | any write | listing not archived | AVAIL.RECORD_ARCHIVED | `record_archived` |
| V11 | `hold.place` | open holds per listing ≤ 50 | AVAIL.HOLD_LIMIT_REACHED | `listing_limit` |
| V12 | `hold.place` | open holds per (holder, listing) ≤ 3 | AVAIL.HOLD_LIMIT_REACHED | `holder_limit` |
| V13 | any request | client sends `available_units` or unknown field | SYS.REQUEST_MALFORMED | `read_only_field` |

## Validation & errors
Module slug `AVAIL` (ASSUMPTION: fits CTR-ERR-001 R02 pattern). `message_key` = `err.avail.<code in lowercase>`.

| Code | Retryable | Category / HTTP |
|---|---|---|
| AVAIL.NOT_APPLICABLE | false | unprocessable_state / 422 |
| AVAIL.UNITS_OUT_OF_RANGE | false | validation / 400 |
| AVAIL.NOT_HOLDABLE | false | unprocessable_state / 422 |
| AVAIL.INSUFFICIENT_UNITS | false | unprocessable_state / 422 |
| AVAIL.TOTAL_BELOW_COMMITTED | false | unprocessable_state / 422 |
| AVAIL.TTL_OUT_OF_RANGE | false | validation / 400 |
| AVAIL.SELF_HOLD_FORBIDDEN | false | forbidden / 403 |
| AVAIL.HOLD_NOT_ACTIVE | false | conflict / 409 |
| AVAIL.HOLD_EXPIRED | false | unprocessable_state / 422 |
| AVAIL.RECORD_ARCHIVED | false | unprocessable_state / 422 |
| AVAIL.HOLD_LIMIT_REACHED | true | rate_limited / 429 (`retry_after_ms`) |

Shared codes used: EVT.REVISION_CONFLICT, EVT.IDEMPOTENCY_KEY_REUSED, SYS.FORBIDDEN, SYS.NOT_FOUND, SYS.REQUEST_MALFORMED, SYS.UNAVAILABLE.

## Authorization
Rule V07 uses the caller's principal kind. Object visibility is in PS-008-05.

## Failure, idempotency, concurrency, offline
Retry behaviour in PS-008-06. Only AVAIL.HOLD_LIMIT_REACHED is retryable.

## Privacy, retention, abuse
Error bodies never contain holder refs, counts beyond the rejected request, or input values (CTR-ERR-001 R06). Abuse limits V11–V12 are the primary control against phantom holds; see PS-008-07.

## Observability & budgets
Metric `avail_rejections_total{code}`. Rule evaluation ≤ 2 ms p95 (ASSUMPTION). See PS-008-08.

## Tests
- TEST-PS-008-02-01 (unit): each of V01–V13 produces its code and field rule; no write occurs.
- TEST-PS-008-02-02 (unit): rule order R02 holds when two rules fail.
- TEST-PS-008-02-03 (negative): error body for a rejected unit count contains no submitted value.
- TEST-PS-008-02-04 (abuse): 51st open hold on one listing and 4th hold by one holder are rejected with retry-after.

## Acceptance criteria
1. Every rule has a unit test; TEST-PS-008-02-01 passes.
2. Error codes match the CTR-ERR-001 category/HTTP table.
3. No rejection response echoes input.

## Assumptions & open decisions
- ASSUMPTION: 50 open holds per listing; 3 per holder per listing; 1–168 h TTL.
- PROVISIONAL (D08 default, unapproved): holds are never queued offline; see PS-008-06.
