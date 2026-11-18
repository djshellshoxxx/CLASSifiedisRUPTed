# PS-082-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_threat. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-082-03.R01 | Threat lifecycle: identified → assessed → mitigating → mitigated, or accepted, then closed. | MVP |
| PS-082-03.R02 | Accepting residual risk requires two approvals (Privacy and Security leads) and an expiry ≤ 180 days (ASSUMPTION). | MVP |
| PS-082-03.R03 | An accepted risk past expiry returns to `assessed` automatically. | MVP |
| PS-082-03.R04 | A closed threat reopens only on new evidence (incident or failed test). | MVP |

## Data / schema
`status` and `residual_risk` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
`threat.register`, `threat.assess`, `threat.update_mitigation`, `threat.accept_risk`, `threat.close`, `threat.reopen`. Events in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | threat.register | PS-082-02 passes | identified | none |
| identified | threat.assess | scores set | assessed | risk computed |
| assessed | threat.update_mitigation | mitigation has req and test IDs | mitigating | none |
| mitigating | threat.update_mitigation | all mitigations `mitigated` with passing tests | mitigated | none |
| assessed, mitigating | threat.accept_risk | two approvals; expiry ≤ 180 d | accepted | expiry timer set |
| accepted | (timer) | expiry passed | assessed | notify owner |
| mitigated, accepted | threat.close | review date met | closed | archive |
| closed | threat.reopen | new evidence cited | assessed | notify owner |

## Validation & errors
`THREAT.INVALID_TRANSITION` (409) for undefined pairs.

## Authorization
Assess and mitigate: Security Lead. Accept risk: two approvals. Close: Privacy Lead.

## Failure, idempotency, concurrency, offline
Transitions use `expected_revision`. Timer job idempotent per threat and expiry.

## Privacy, retention, abuse
Transitions carry IDs only.

## Observability & budgets
Gauges per state; overdue reviews count (target 0).

## Tests
- TEST-PS-082-03-01 (state): table rows pass, others rejected.
- TEST-PS-082-03-02 (acceptance): single approval cannot accept risk.
- TEST-PS-082-03-03 (timer): accepted risk reverts after expiry.

## Acceptance criteria
1. Table exhaustive and tested.
2. Dual approval enforced.
3. Expiry reversion verified.

## Assumptions & open decisions
- ASSUMPTION: 180-day acceptance limit.
- PROVISIONAL (D04 default, unapproved): explicit per-party attestations are the mitigation model for partial execution risks.
