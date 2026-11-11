# F12.S03.M04 Account limits (PS-098)

Files: `index.ts`, `limits.test.ts`.

## Implemented
- Repo `moderation.account_limit` (one record per subject and limit key; indexes key, subject, expiry), tier table, tier thresholds (established: 7 days and 3 deals; trusted: 90 days and 10 deals; configurable through `thresholds`), `computeEffective` (restriction 0, active override, else max(1, floor(base x multiplier)) unless base 0).
- Commands `moderation.accountlimit.override` (30 per moderator per day, RATE_LIMITED after that), `moderation.accountlimit.clear_override`; queries `moderation.accountlimit.check` (surface `vault`: reachable only in process, never over HTTP), `moderation.accountlimit.list_mine`; event `moderation.limit.changed` (only when the effective value changes, same transaction); error `ACCOUNT_LIMIT_REACHED`.
- Consumers: `moderation.limits_risk` (moderation.risk.elevated, subjectType key; low restores the base), `moderation.limits_deal` (commerce.deal.completed, parties from N3), `moderation.limits_account` (identity.account.created), `moderation.limits_action` (restrict_feature naming limit keys).
- Maintenance functions for the root to run inside a command transaction: `expireOverrides(ctx)` every 60 s, `tierSweep(ctx, thresholds?)` daily at 03:15 UTC (also expires overrides; never loses more than one tier per sweep), `purgeSubjectLimits(tx, subjectKey)` for membership deletion, `weeklyOverrideReport(auditEntries, now)`.
- `LIMITS_ROLES` for `createRoleTableAuthz`.

## Ports and options
- `flow?: FlowCounterPort` (`consume({tenantId, counter, subject, limit, windowMs}, cost)`, optional `peek`); default is `createRollingWindowCounter(clock)`, in memory. `flowFailMode(limitKey)` (default open for flow limits; closed gives DEPENDENCY_UNAVAILABLE). `thresholds`, `overridesPerDay`, `metrics`.
- The relay root must wire these in process and call `moderation.accountlimit.check` through the bus with origin local.

## Deviations
- Flow limits use the module's own rolling 24 h window counter through `FlowCounterPort` instead of F12.S03.M03: a RatePolicy cannot express a per-day rate (ratePerMinute minimum 1). The root may implement the port on top of any atomic counter.
- A denied check returns the error `ACCOUNT_LIMIT_REACHED` with params `{ limitKey, effectiveValue, used, resetsAt?, reasons }` (V06, T07) rather than an ok body with `allowed: false` as in the spec example. Allowed checks return `{ allowed: true, effectiveValue, used, resetsAt?, reasons }`.
- Restriction (moderation action) dominates an override; its expiry is cleared by `expireOverrides` with cause `policy`.
- Expired overrides are cleared from the row (history lives in the bus audit log, per spec).

## Test rows not covered
T11 (30-day retention after membership deletion and 1-year audit history are root scheduling and audit concerns; `purgeSubjectLimits` is tested only as a function), T12 load, T13 traceability, T14 export and restore, T15 e2e.

## Open questions
- moderation.action.applied has no limit key field in its documented payload; this module reads optional `limitKey` / `limitKeys`. Who adds them?
- commerce.deal.completed payload documents `{ dealId, contextRef, completedAt }`; this module reads `parties[{did}]` as N3 says.
- Rate-store outage: spec ties flow limits to the F12.S03.M03 class fail mode; `flowFailMode` is the injected equivalent.
