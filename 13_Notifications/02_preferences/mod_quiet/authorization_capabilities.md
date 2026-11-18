# PS-108-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-05.R01 | Owner starts, resumes and reads own pause (`quiet_period.create`, `quiet_period.execute`, `quiet_period.read`; scope self). | MVP |
| PS-108-05.R02 | `sys_` holds and releases notifications under global scope with purpose `notification_gating`, expiry ≤ 72 h. | MVP |
| PS-108-05.R03 | No other account, operator or moderator can read a pause state. | MVP |
| PS-108-05.R04 | Foreign IDs return `SYS.NOT_FOUND`. | MVP |

## Data / schema
| Principal | Capability | Scope | Outcome |
|---|---|---|---|
| user (owner) | `quiet_period.create` | self | ALLOW (ALLOW_OWNER) |
| user (other) | `quiet_period.read` | foreign | DENY → SYS.NOT_FOUND |
| sys | `quiet_period.execute` | global | ALLOW (grant) |
| sender account | `quiet_period.read` | target | DENY (NO_RELATION; senders learn nothing) |
| ope | `quiet_period.read` | any | DENY (PRIVATE_PERSONAL, dual control cannot override) |
| mod | `quiet_period.read` | case | DENY |

## Commands / queries / events
Gating decisions write `dec_` records without period contents beyond the `qpd_` ID.

## States & transitions
Grant lifecycle only.

## Validation & errors
Standard CTR-CAP-001 denials.

## Authorization
Server-side on every call; the sender-facing path never reveals quiet state (no "user is unavailable" signal).

## Failure, idempotency, concurrency, offline
Revocation effective next decision; decision cache zero for quiet state.

## Privacy, retention, abuse
Decision records hold outcome only; RET-AUD 12 months.

## Observability & budgets
Counter `quiet_decisions_total{outcome}`.

## Tests
- TEST-PS-108-05-01 (unit): sender account cannot observe quiet state through any API.
- TEST-PS-108-05-02 (integration): operator read denied.
- TEST-PS-108-05-03 (unit): expired execute grant denies release with GRANT_EXPIRED.
- TEST-PS-108-05-04 (contract): federation peer denied.

## Acceptance criteria
1. Matrix matches tests.
2. No sender-visible signal.
3. Decision records have no period content.

## Assumptions & open decisions
- ASSUMPTION: purpose `notification_gating` shared with mod_hours.
- D07 PROVISIONAL (D07 default, unapproved).
