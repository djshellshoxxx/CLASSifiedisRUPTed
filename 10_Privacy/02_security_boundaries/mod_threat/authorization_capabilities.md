# PS-082-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-05.R01 | Only named reviewers have `threat.read`; no end-user or public access. | MVP |
| PS-082-05.R02 | Accepting risk requires two distinct approvers; neither may be the threat owner (CAP.SELF_APPROVAL_FORBIDDEN). | MVP |
| PS-082-05.R03 | Exploit detail fields have visibility `global` reviewer only (CTR-CAP-001 R10). | MVP |
| PS-082-05.R04 | Default deny for undeclared actions. | MVP |

## Data / schema
Capabilities: `threat.read`, `threat.propose`, `threat.assess`, `threat.accept`, `threat.close`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.FORBIDDEN` for known roles without permission; `SYS.NOT_FOUND` for others.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| Privacy Lead | threat.propose, threat.close | threat | ALLOW |
| Security Lead | threat.assess, threat.update_mitigation | threat | ALLOW |
| owner | threat.accept | own threat | DENY, CAP.SELF_APPROVAL_FORBIDDEN |
| two non-owner leads | threat.accept | threat | ALLOW (dual) |
| end user | threat.read | any | DENY, SYS.NOT_FOUND |

## Failure, idempotency, concurrency, offline
Decision fails closed (SYS.UNAVAILABLE). No offline access.

## Privacy, retention, abuse
Reviewer reads produce `aud_` records (CTR-CAP-001 R08).

## Observability & budgets
Metric `threat_authz_denies_total{action}`.

## Tests
- TEST-PS-082-05-01 (matrix): table outcomes.
- TEST-PS-082-05-02 (dual control): one approver rejected.
- TEST-PS-082-05-03 (visibility): exploit field absent for Privacy Lead on `global` read.

## Acceptance criteria
1. Matrix passes.
2. Dual control enforced.
3. Field visibility enforced.

## Assumptions & open decisions
- PROVISIONAL (CTR-CAP-001 default, unapproved).
- ASSUMPTION: Privacy Lead lacks `global` exploit-field read by default.
