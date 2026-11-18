# PS-069-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R05 state set applies to claims, not routes; R12 reorg), CTR-EVT-001 (R02, R13). **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-03.R01 | Route states are exactly `DECLARED`, `SUPERSEDED`, `WITHDRAWN`, `SUSPENDED`, `EXPIRED`. A route is never "paid", "settled" or "verified"; those belong to claims (CTR-COM-001 R05). | MVP |
| PS-069-03.R02 | Each transition appends one `route.*` event with `state_version` (CTR-EVT-001 R02). No in-place update. | MVP |
| PS-069-03.R03 | `SUSPENDED` routes stay visible to their party with a reason key, and can be used by no new claim. Existing claims are unaffected. | MVP |
| PS-069-03.R04 | A route becomes `EXPIRED` no later than 1 h after its trx reaches `FINAL`, `REVERSED` or cancellation. | MVP |
| PS-069-03.R05 | `WITHDRAWN` is refused while a claim in `CLAIMED` or later references the route (`NONCUST.ROUTE_IN_USE`). | MVP |

## Data / schema
Transition log row: `route_id`, `from_state`, `event`, `to_state`, `state_version`, `actor_ref`, `recorded_at`, `reason_key` (nullable).

## Commands / queries / events
Commands listed in PS-069-04. Events: `route.declared`, `route.superseded`, `route.withdrawn`, `route.suspended`, `route.restored`, `route.expired`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| — | `route.declare` | validation pass (PS-069-02) | `DECLARED` | `route.declared`; notify counterparty (generic text) |
| `DECLARED` | `route.replace` | no claim references the old route | `SUPERSEDED` (old), new `DECLARED` | `route.superseded`; trx re-consent flag if proposal consented |
| `DECLARED` | `route.withdraw` | actor is owner; R05 satisfied | `WITHDRAWN` | `route.withdrawn` |
| `DECLARED` | `adapter.suspend` | adapter_id matches | `SUSPENDED` | `route.suspended` with reason key |
| `SUSPENDED` | `adapter.restore` | adapter `registered` | `DECLARED` | `route.restored` |
| `DECLARED` or `SUSPENDED` | trx `FINAL`/`REVERSED`/cancelled | R04 window | `EXPIRED` | `route.expired`; starts RET-EVD clock |
| `SUSPENDED` | `route.withdraw` | owner | `WITHDRAWN` | `route.withdrawn` |
| `SUPERSEDED`, `WITHDRAWN`, `EXPIRED` | any | — | no transition | command refused, `SYS.UNPROCESSABLE_STATE` |

## Validation & errors
Invalid transitions return `SYS.UNPROCESSABLE_STATE` (not retryable) with `from_state` in the diagnostic only.

## Authorization
Transitions are authorized per PS-069-05. Adapter transitions require `sys_` or `ope_` principals.

## Failure, idempotency, concurrency, offline
Concurrent replace and withdraw on one route: first committed wins; second receives `SYS.CONFLICT` with the current `state_version`. Expiry is driven by a scheduled job that is idempotent on (`route_id`, `state_version`).

## Privacy, retention, abuse
`SUPERSEDED`, `WITHDRAWN` and `EXPIRED` rows are retained per PS-069-07; `contact_hint` is purged earlier there.

## Observability & budgets
Gauge: routes per status. Histogram: time from trx `FINAL` to `EXPIRED` (target ≤ 1 h p95).

## Tests
- TEST-PS-069-03-01 (unit): transition table exhaustive; every undefined pair returns `SYS.UNPROCESSABLE_STATE`.
- TEST-PS-069-03-02 (property): `state_version` strictly increases by 1 per event.
- TEST-PS-069-03-03 (integration): adapter suspend hides route from new claims but not from existing ones.
- TEST-PS-069-03-04 (concurrency): replace vs withdraw race yields exactly one winner.

## Acceptance criteria
1. Table above is the only transition set; no other transitions are implemented.
2. `EXPIRED` is reached within 1 h of trx terminal state in 99% of cases in staging.
3. No route state string contains "paid", "settled" or "payment received".

## Assumptions & open decisions
- ASSUMPTION: 1 h expiry lag is acceptable.
- D09 (PROVISIONAL default, unapproved): routes are instructions; state machine does not model money movement.
