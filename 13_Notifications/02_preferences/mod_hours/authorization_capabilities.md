# PS-105-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_hours. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-105-05.R01 | Only the owning `acc_` reads or writes its windows (`delivery_window.read`, `delivery_window.update`, scope self). | MVP |
| PS-105-05.R02 | `sys_` dispatcher may execute `delivery_window.evaluate` with global scope, purpose `notification_gating`, expiry ≤ 72 h. | MVP |
| PS-105-05.R03 | No `ope_`, `mod_` or `fpr_` principal can read windows, even with grant (PRIVATE_PERSONAL, CTR-CAP-001 R06). | MVP |
| PS-105-05.R04 | Cross-account requests return `SYS.NOT_FOUND`. | MVP |

## Data / schema
| Principal | Capability | Scope | Outcome |
|---|---|---|---|
| user (owner) | `delivery_window.update` | self | ALLOW (ALLOW_OWNER) |
| user (other) | `delivery_window.read` | foreign | DENY → SYS.NOT_FOUND |
| sys | `delivery_window.evaluate` | global | ALLOW (grant) |
| sys | `delivery_window.read` | global | DENY (evaluate returns decision only) |
| ope | `delivery_window.read` | any | DENY (dual control cannot override R03) |
| fpr | any | any | DENY (windows never federate) |

Field visibility: `weekdays`, `start_min`, `end_min`, `tz` = `owner` only; `dwn_id`, `channel` = `participant`/`owner`.

## Commands / queries / events
Grant creation and each evaluate batch emit `aud_` records (CTR-CAP-001 R08). Evaluate audit records carry counts, not windows.

## States & transitions
Grant lifecycle only.

## Validation & errors
Denials: `SYS.FORBIDDEN` for visible, `SYS.NOT_FOUND` otherwise.

## Authorization
Enforced server-side on every call. Account deletion removes windows and invalidates pending evaluation grants.

## Failure, idempotency, concurrency, offline
Decision cache TTL zero for writes; ≤ 60 s for evaluate per CTR-CAP-001 R09 (ASSUMPTION for window cache).

## Privacy, retention, abuse
Decision records (`dec_`) store outcome only. Retention RET-AUD 12 months.

## Observability & budgets
Counter `hours_decisions_total{capability,outcome}`.

## Tests
- TEST-PS-105-05-01 (unit): owner read succeeds; other account read returns NOT_FOUND.
- TEST-PS-105-05-02 (integration): operator with single approval cannot read windows (DUAL_APPROVAL_MISSING and then denial).
- TEST-PS-105-05-03 (unit): expired evaluate grant returns GRANT_EXPIRED.
- TEST-PS-105-05-04 (contract): federation peer principal denied.

## Acceptance criteria
1. Capability matrix matches tests.
2. No operator path exposes schedules.
3. Every evaluate batch has `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: purpose `notification_gating` registered with F16.
- Privacy default for windows: D07 default, PROVISIONAL (D07 default, unapproved).
