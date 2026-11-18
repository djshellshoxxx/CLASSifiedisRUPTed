# PS-032-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-07.R01 | `scope_text` is PRIVATE_PERSONAL. Price, currency and line items are FINANCIAL_EVIDENCE after SENT. | MVP |
| PS-032-07.R02 | Unaccepted quotes (DRAFT, SENT, DECLINED, WITHDRAWN, EXPIRED, SUPERSEDED) are deleted 90 days after terminal state (ASSUMPTION). Scope text is removed at 30 days after terminal state. | MVP |
| PS-032-07.R03 | ACCEPTED quotes are retained as commerce evidence per D07 default: 14-day dispute window plus 365 days (PROVISIONAL), then party refs pseudonymized. Legal hold overrides. | MVP |
| PS-032-07.R04 | Per provider: ≤ 20 quotes sent per day (ASSUMPTION); excess → `SYS.RATE_LIMITED`. | MVP |
| PS-032-07.R05 | Scope text with off-platform contact details raises an advisory signal to F12 (no block in MVP). | MVP |

## Data / schema
Retention fields: `retain_until`, `legal_hold` (F10 only), `scope_purged_at`. Pseudonymization replaces `customer` and `provider` links with tombstone tokens; amounts remain.

## Commands / queries / events
Purge runs as `sys` and emits `svcquote.purged` (counts only).

## States & transitions
ACTIVE → SCOPE_PURGED (+30 days, unaccepted) → PURGED (+90 days, unaccepted) ; ACCEPTED → ARCHIVED → PSEUDONYMIZED (+365 days).

## Validation & errors
Export or purge under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Party may export own quotes. Purge is `sys` only.

## Failure, idempotency, concurrency, offline
Purge is idempotent per quote. Purge cannot touch a quote with an open dispute (F09.S02.M02).

## Privacy, retention, abuse
Abuse patterns: quote spam; bait-and-switch (price change without supersede); scope text used to move contact off-platform; fake quotes to block availability. Controls: R04 rate limit, supersede-only changes (PS-032-03 R04), R05 advisory, hold TTL (PS-028-03 R02). Pseudonyms do not hide the price from the accepting party.

## Observability & budgets
Metrics: `svcquote_rate_limited_total`, `svcquote_scope_flags_total`, `svcquote_purged_total`. No scope text or amounts in logs.

## Tests
- TEST-PS-032-07-01 (lint): every field has one data class; scope text absent from event payloads.
- TEST-PS-032-07-02 (abuse): 21st quote in one day rejected with `SYS.RATE_LIMITED`.
- TEST-PS-032-07-03 (integration): scope text purged at 30 days; quote row retained.
- TEST-PS-032-07-04 (integration): legal hold blocks purge.

## Acceptance criteria
1. Retention job matches R02 and R03 in scheduler configuration.
2. Price change without supersede is rejected in integration tests.
3. Advisory signal contains quote ID only.

## Assumptions & open decisions
- ASSUMPTION: 90-day and 30-day unaccepted-quote retention; 20 quotes per provider per day.
- PROVISIONAL: D07 retention defaults (unapproved). Legal periods OPEN. See [DECISIONS.md](../../../DECISIONS.md).
