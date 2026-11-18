# PS-108-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-06.R01 | Period end timer is stored as absolute `ends_at` and survives restart. | MVP |
| PS-108-06.R02 | Release of held items is idempotent per (`ntf_id`, `qpd_id`). | MVP |
| PS-108-06.R03 | If the release job is late, items are still released on the next run before their 24-hour limit; no item is released after 24 h. | MVP |
| PS-108-06.R04 | Holding is fail-safe: if the gating service is unavailable, non-security notifications are held, not sent. | MVP |

## Data / schema
Held key = (`ntf_id`, `qpd_id`). Retention 7 days after release.

## Commands / queries / events
Start and resume return the same result on replay. Events are emitted after commit.

## States & transitions
See workflow_state_machine.

## Validation & errors
`SYS.CONFLICT` on stale revision for replace; client re-reads.

## Authorization
Release uses sys grant valid at release time.

## Failure, idempotency, concurrency, offline
- Crash during release: resume from held list; duplicate sends prevented by held-state check.
- Offline: start queued per D08; if reconnect occurs after `ends_at`, the period is created already ended.
- Concurrency: resume and expiry racing → one `ended` event (first commit wins).

## Privacy, retention, abuse
Held rows purged on release.

## Observability & budgets
Counter `quiet_release_late_total`; alert if release lag > 5 min.

## Tests
- TEST-PS-108-06-01 (integration): crash during release yields no duplicate sends.
- TEST-PS-108-06-02 (offline): start offline after `ends_at` creates ended period.
- TEST-PS-108-06-03 (chaos): gating unavailable holds non-security items.
- TEST-PS-108-06-04 (integration): resume vs expiry race yields exactly one ended event.

## Acceptance criteria
1. Release idempotent in fault injection.
2. Fail-safe holding verified.
3. Race test passes 1000 iterations.

## Assumptions & open decisions
- ASSUMPTION: 5-minute lag alert.
- D08 PROVISIONAL (D08 default, unapproved).
