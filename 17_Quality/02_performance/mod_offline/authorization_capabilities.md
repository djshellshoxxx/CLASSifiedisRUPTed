# PS-140-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_offline. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (action matrix, scopes, default deny), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-140-05.R01 | Default deny: an action without a matching grant returns `SYS.FORBIDDEN` (or `SYS.NOT_FOUND` for unreadable objects). | MVP |
| PS-140-05.R02 | Scenario writes require capability `offtest.scenario.administer`, held through an explicit grant with `expires_at` ≤ 90 days (ASSUMPTION). | MVP |
| PS-140-05.R03 | Run recording is limited to `sys_` runner principals holding `offtest.run.record`. | MVP |
| PS-140-05.R04 | This module grants no access to F15 pending-write or device records. Such reads are denied at every scope. | MVP |

## Authorization
| Actor (principal) | Action (CTR-CAP-001 verb) | Scope | Decision |
|---|---|---|---|
| QA maintainer `acc_` with `offtest.scenario.administer` | offline_scenario.create, update, retire | global | ALLOW |
| Same maintainer | offline_scenario.activate (second approver) | global | ALLOW only if approver ≠ requester (CTR-CAP-001 R07 analogue, ASSUMPTION) |
| CI runner `sys_` with `offtest.run.record` | offline_run.create | global | ALLOW |
| CI runner `sys_` | offline_scenario.update | global | DENY |
| Any `acc_` with `offtest.run.read` | offline_run.read (summary fields) | global | ALLOW |
| `mod_` or `ope_` principal, no grant | any write | global | DENY |
| Any principal | offline_run.read with fixture body | global | DENY (no fixture bodies stored) |

Principal types per CTR-CAP-001 R02. Authorization uses `acc_` identity only; request-body actor fields are ignored (CTR-CAP-001 R11).

## Validation & errors
Denied requests return `SYS.FORBIDDEN` (403). Hidden scenario or run IDs return `SYS.NOT_FOUND` (404) so existence is not revealed.

## Failure, idempotency, concurrency, offline
- Grant revocation takes effect at the next decision; the runner re-checks `offtest.run.record` before each `RecordOfflineRun`.
- Runners are offline-tolerant only in the sense of buffering run records; authorization is always checked online at flush.

## Assumptions & open decisions
- ASSUMPTION: capability names and 90-day grant ceiling are provisional until F16 Security Lead review.
- D10 (auth and portability) is not affected by this module: PROVISIONAL (D10 default, unapproved).
