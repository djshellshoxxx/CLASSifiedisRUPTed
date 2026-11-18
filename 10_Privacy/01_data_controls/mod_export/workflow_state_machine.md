# PS-078-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-PRV-001 (lifecycle `active`→`expired`→`purged`), CTR-CAP-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-03.R01 | States exactly: `requested`, `generating`, `ready`, `downloaded`, `expired`, `failed`. | MVP |
| PS-078-03.R02 | `generating` → `failed` after 3 attempts (ASSUMPTION); failed exports never become ready. | MVP |
| PS-078-03.R03 | `ready` → `expired` at `ready_at` + 7 days; `downloaded` → `expired` at first download + 24 h, whichever comes first. | MVP |
| PS-078-03.R04 | A package is downloadable only in `ready`. The first complete download moves it to `downloaded`. In `downloaded`, only range requests that resume an interrupted first download are accepted, with the same token, until expiry (PS-078-06 R03). | MVP |
| PS-078-03.R05 | Every transition emits one event with `aggregate_revision + 1`. | MVP |

## Data / schema
State on `data_subject_request.state`. Generation progress in `export_job` (`attempt`, `lease_until`, `last_error_code`), no content.

## Commands / queries / events
Events: `export.requested`, `export.generating`, `export.ready`, `export.downloaded`, `export.expired`, `export.failed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | request | PS-078-02 pass | requested | Row created |
| requested | worker lease acquired | quota ok | generating | Lease 15 min |
| generating | package verified | manifest hashes match | ready | Notify subject (generic text) |
| generating | error | attempts < 3 | generating | Backoff |
| generating | error | attempts = 3 | failed | Ops alert; subject notified |
| ready | first download | token valid | downloaded | Token hash consumed |
| ready or downloaded | expiry | time reached | expired | Package deleted (PS-078-07) |

## Validation & errors
Invalid transitions → `EXPORT.INVALID_TRANSITION` (409). Download in `expired` → `EXPORT.PACKAGE_EXPIRED` (410).

## Authorization
Owner only. Worker is `sys_`.

## Failure, idempotency, concurrency, offline
Lease prevents duplicate generation. Crash during generation → lease expiry → retry from scratch (no partial package served).

## Privacy, retention, abuse
Notifications carry no content and no scope detail.

## Observability & budgets
`export_state_total{state}`; `export_generation_seconds` p95 ≤ 15 min for accounts ≤ 1 GB (ASSUMPTION).

## Tests
- TEST-PS-078-03-01 (property): no sequence reaches `ready` from `failed`.
- TEST-PS-078-03-02 (integration): expiry at 7 days and at 24 h after first download, both verified with a clock fixture.

## Acceptance criteria
1. Transition table fully covered by tests.
2. A package is never served before `ready`.
3. Expiry deletes package bytes within 1 h of expiry time (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: 3 generation attempts, 15 min lease, 7-day and 24 h windows.
- PROVISIONAL (D07 default): minimal retention for generated packages.
