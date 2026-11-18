# PS-138-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_chaos. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-138-05.R01 | Proposing requires `ope` with `execute` on `chaos_experiment` at `global` scope. | MVP |
| PS-138-05.R02 | Approval requires a second `ope` distinct from proposer (CAP.SELF_APPROVAL_FORBIDDEN). | MVP |
| PS-138-05.R03 | Starting requires `sys_` scheduler or operator; the scheduler may not approve. | MVP |
| PS-138-05.R04 | Abort is allowed to the experiment operator and any SRE on call. | MVP |
| PS-138-05.R05 | No grant covers production components. | MVP |

## Data / schema
Capability IDs: `chaos_experiment.propose`, `chaos_experiment.approve`, `chaos_experiment.start`, `chaos_experiment.abort`.

## Commands / queries / events
Decision records on denial.

## States & transitions
Grant revocation during a running experiment does not stop it; abort remains available (R04).

## Validation & errors
| Actor | Action | Result |
|---|---|---|
| ope | propose | allow |
| ope (proposer) | approve | DENY, CAP.SELF_APPROVAL_FORBIDDEN |
| sys scheduler | approve | DENY, SYS.FORBIDDEN |
| SRE on call | abort | allow |
| any | any on production target | DENY, CHAOS.PRODUCTION_TARGET_FORBIDDEN |

## Authorization
Time-bound operator grants (≤ 72 h, CTR-CAP-001 R06).

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
Decision records carry no target hostnames.

## Observability & budgets
Counter `chaos_authz_denied_total{rule}`.

## Tests
- TEST-PS-138-05-01: unit, decision table.
- TEST-PS-138-05-02: negative, scheduler approval denied.

## Acceptance criteria
1. No approval by proposer or scheduler in fixtures.
2. Abort available in all running fixtures.

## Assumptions & open decisions
- ASSUMPTION: SRE on-call roster from F15.
- D10: PROVISIONAL (D10 default, unapproved) for any credentials used by faults.
