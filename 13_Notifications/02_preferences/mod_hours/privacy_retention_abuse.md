# PS-105-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-07.R01 | Windows are PRIVATE_PERSONAL and visible only to the owning account. | MVP |
| PS-105-07.R02 | Zone is user-selected; no inference from IP, device locale or precise location (D05 PROVISIONAL). | MVP |
| PS-105-07.R03 | Events and provider payloads carry no window content; `defer_until` is hour-bucketed. | MVP |
| PS-105-07.R04 | Windows deleted on account deletion within 30 days grace (RET-ACC) and purged thereafter. | MVP |
| PS-105-07.R05 | Windows are not used for analytics outside this module's gating. | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| weekdays, start_min, end_min, tz | PRIVATE_PERSONAL | RET-PRIV: 365 days after last access or deletion |
| dwn_id, channel, revision | PSEUDONYMOUS | RET-ACC |
| deferred record (ntf_id, defer_until) | PSEUDONYMOUS | RET-OPS, 7 days |

## Commands / queries / events
No window content in any event (PS-105-04.R03).

## States & transitions
Account deletion triggers window purge; deferred records for that account are dropped with reason `ACCOUNT_DELETED`.

## Validation & errors
Diagnostics never include `tz` values.

## Authorization
Owner only; see authorization_capabilities.

## Failure, idempotency, concurrency, offline
Purge job idempotent; retried until verified.

## Privacy, retention, abuse
- Inference risk: a sender who sees timing of notifications can estimate schedule. Mitigation: bucketed `defer_until`, no per-sender timing info exposed.
- Abuse: attempts to enumerate other users' windows via evaluate (blocked by sys-only path).
- Abuse: repeatedly toggling windows to force evaluator load: limit 20 writes per account per hour (ASSUMPTION).
- Legal hold (RET-LEGAL) applies only where a moderation case requires it; windows are not evidence by default.

## Observability & budgets
Logs contain counts and codes only.

## Tests
- TEST-PS-105-07-01 (contract): log scan finds no `tz` or minute values.
- TEST-PS-105-07-02 (integration): account deletion purges windows and deferred rows within SLA.
- TEST-PS-105-07-03 (negative): IP-derived zone suggestion is never auto-applied.
- TEST-PS-105-07-04 (unit): write-rate limit returns HOURS.RATE_LIMITED.

## Acceptance criteria
1. Automated scans pass for logs and events.
2. Purge verified in retention test.
3. Privacy Lead review pending (no audit claimed).

## Assumptions & open decisions
- ASSUMPTION: 20 writes per hour limit and 30-day deletion grace.
- D07 PROVISIONAL (D07 default, unapproved) for retention classes.
- D05 PROVISIONAL (D05 default, unapproved) for zone source.
