# PS-105-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-03.R01 | A window set is `current` or `superseded`. Each replace-all write creates a new revision and supersedes the prior one. | MVP |
| PS-105-03.R02 | A gated notification is `evaluated`, then `delivered` (inside window or bypass), `deferred` (outside window) or `dropped`. | MVP |
| PS-105-03.R03 | A deferred notification is re-evaluated at `defer_until` and delivered or dropped; it is never delivered twice. | MVP |
| PS-105-03.R04 | Deferral never exceeds 48 hours; after that the notification is dropped for `activity` and `transactional` (ASSUMPTION). | MVP |

## Data / schema
Gating reads the current window set and the notification `category` (registry in mod_opt). Bypass categories: `security` (always), `deadline` (bypasses hours, not quiet).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `hours.set_windows` accepted | R02 validation passes | current (rev n) | emit `delivery_window.updated` |
| current | `hours.set_windows` accepted | revision matches | current (rev n+1); previous superseded | emit `delivery_window.updated` |
| evaluated | category `security` or `deadline` | none | delivered | none |
| evaluated | inside window | none | delivered | none |
| evaluated | outside window, category `activity` or `transactional` | deferral ≤ 48 h | deferred | set `defer_until` = next window start; emit `notification.window_deferred` |
| evaluated | outside window, no future window within 48 h | none | dropped | emit `notification.window_dropped` |
| deferred | `defer_until` reached | window still closed | deferred (new defer_until) | none |
| deferred | `defer_until` reached | window open | delivered | none |
| deferred | window set changed to no restriction | none | delivered | emit `notification.window_released` |

## Validation & errors
Invalid transition: `HOURS.INVALID_STATE_TRANSITION` (non-retryable).

## Authorization
Owner writes windows. `sys_` evaluates and transitions notifications. See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Deferral timer is durable. Duplicate evaluation of same notification returns the same decision (idempotent by `ntf_id` + `window_rev`).

## Privacy, retention, abuse
Deferred records hold `ntf_id`, `defer_until` and category only.

## Observability & budgets
Gauge `hours_deferred_backlog{channel}`. Evaluation p95 ≤ 5 ms with per-account cache (TTL 60 s).

## Tests
- TEST-PS-105-03-01 (unit): every row in the table is covered.
- TEST-PS-105-03-02 (property): a notification has at most one terminal decision.
- TEST-PS-105-03-03 (integration): deferred notification delivered exactly once at window open.
- TEST-PS-105-03-04 (integration): 48 h cap drops `activity` notification.

## Acceptance criteria
1. No notification delivered twice in 10 000-run simulation.
2. Security notifications never deferred in any fixture.
3. All transitions emit events in the table.

## Assumptions & open decisions
- ASSUMPTION: 48 h deferral cap.
- No D-ID blocks state logic.
