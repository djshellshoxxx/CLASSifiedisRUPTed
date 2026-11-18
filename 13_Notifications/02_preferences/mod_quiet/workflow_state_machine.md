# PS-108-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-03.R01 | Period states: `scheduled` (none in MVP), `active`, `ended`. | MVP |
| PS-108-03.R02 | While `active`, push, email and banners are held; in-app inbox recording continues. | MVP |
| PS-108-03.R03 | `security` notifications are never held. | MVP |
| PS-108-03.R04 | At `ends_at`, held notifications are released per category rule (below), then the period is `ended`. | MVP |

## Data / schema
Release rule at end: `deadline` held items released if `now − created_at` ≤ 24 h, else dropped; `transactional` released if ≤ 24 h, else dropped; `activity` always dropped. Released items still pass mod_hours gating.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `quiet.start` accepted | R01–R03 | active | emit `quiet_period.started` |
| active | `quiet.start` replace | revision matches | active (new ends_at) | emit `quiet_period.extended` (or `replaced`) |
| active | `quiet.resume` | owner | ended (`resumed`) | release held per rule; emit `quiet_period.ended` |
| active | `ends_at` reached | timer | ended (`expired`) | release held per rule; emit `quiet_period.ended` |
| active | account deletion | none | ended (`account_deleted`) | drop held; emit `quiet_period.ended` |
| inactive | `quiet.resume` | none | inactive | no-op (PS-108-02.R04) |
| any notification | arrives while active and category ≠ security | none | held | emit `notification.quiet_held` |

## Validation & errors
`QUIET.INVALID_STATE_TRANSITION` for transitions that cannot occur (should not occur; defensive).

## Authorization
Owner starts and resumes; sys holds and releases.

## Failure, idempotency, concurrency, offline
Timer durable; release is idempotent per held item.

## Privacy, retention, abuse
Held records keep `ntf_id`, category and times only.

## Observability & budgets
Gauge `quiet_active_periods` (count, no account labels). Release run p95 ≤ 30 s after `ends_at`.

## Tests
- TEST-PS-108-03-01 (unit): each transition row covered.
- TEST-PS-108-03-02 (integration): security notification delivered during active period.
- TEST-PS-108-03-03 (integration): deadline held 3 h released at end; held 25 h dropped.
- TEST-PS-108-03-04 (integration): resume releases held items exactly once.

## Acceptance criteria
1. Held and released item counts reconcile in test.
2. No security item held in any fixture.
3. Release within 30 s of end in test clock.

## Assumptions & open decisions
- ASSUMPTION: 24-hour release window.
- No D-ID blocks state logic.
