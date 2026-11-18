# PS-081-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-05.R01 | Only Privacy Lead can propose versions or register flows. | MVP |
| PS-081-05.R02 | Only Security Lead can approve or reject versions. Self-approval forbidden (CAP.SELF_APPROVAL_FORBIDDEN). | MVP |
| PS-081-05.R03 | Read access to the model is `global` for named reviewers; not available to end users. | MVP |
| PS-081-05.R04 | Default deny for all other actions. | MVP |

## Data / schema
Capabilities: `model.propose`, `model.accept`, `model.read`, `flow.propose`, `flow.retire`.

## Commands / queries / events
Mapped in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Authorization does not change state; see [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
`SYS.FORBIDDEN` for known reviewers without role; `SYS.NOT_FOUND` for end users.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| Privacy Lead | model.propose | model | ALLOW |
| Security Lead | model.accept | version (not self-proposed) | ALLOW |
| Security Lead | model.accept | own proposal | DENY, CAP.SELF_APPROVAL_FORBIDDEN |
| end user | model.read | model | DENY, SYS.NOT_FOUND |
| sys_ (CI) | flow.read | flows | ALLOW (drift check) |

## Failure, idempotency, concurrency, offline
Decision fails closed (SYS.UNAVAILABLE). Offline clients have no access.

## Privacy, retention, abuse
Reads by reviewers produce `aud_` records (CTR-CAP-001 R08).

## Observability & budgets
Metric `model_authz_denies_total{action}`.

## Tests
- TEST-PS-081-05-01 (matrix): table rows produce stated outcomes.
- TEST-PS-081-05-02 (self-approval): proposer approval rejected.
- TEST-PS-081-05-03 (default deny): undeclared action denied.

## Acceptance criteria
1. Matrix passes in CI.
2. Self-approval blocked in 100% of tests.
3. Default deny verified.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 default, unapproved): governance of capability grants.
- ASSUMPTION: CI drift-check principal is `sys_` with read-only scope.
