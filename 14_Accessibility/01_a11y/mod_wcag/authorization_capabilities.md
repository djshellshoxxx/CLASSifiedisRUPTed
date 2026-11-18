# PS-111-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-05.R01 | Only QA Lead and Accessibility Lead roles may submit records or transition findings. | MVP |
| PS-111-05.R02 | Accepting risk requires an Accessibility Lead approval distinct from the submitter. | MVP |
| PS-111-05.R03 | Gate and records are readable by all engineering roles. | MVP |

## Data / schema
Capabilities: `conformance_record.submit`, `accessibility_finding.transition`, `accessibility_finding.accept_risk`, `wcag_gate.read`.

## Commands / queries / events
Per [PS-111-04](commands_queries_events.md).

## States & transitions
Not applicable.

## Validation & errors
Denials return CTR-CAP-001 standard denial.

## Authorization
| Actor | Action | Resource | Decision |
|---|---|---|---|
| QA Lead (ope_) | submit, transition (not accept_risk) | acr_, acf_ | ALLOW |
| Accessibility Lead (ope_) | all of above incl. accept_risk | acf_ | ALLOW, distinct approver for accept_risk |
| Engineering roles | wcag_gate.read | gate | ALLOW |
| acc_ | submit or transition | any | DENY |

## Failure, idempotency, concurrency, offline
Grant revocation effective at next decision (CTR-CAP-001 R09).

## Privacy, retention, abuse
Accepted-risk approvals recorded as `aud_` records.

## Observability & budgets
Audit records per approval.

## Tests
- TEST-PS-111-05-01 unit: decision table.
- TEST-PS-111-05-02 integration: same person submits and approves accept_risk → refused.

## Acceptance criteria
1. accept_risk requires two distinct principals in test.
2. Every accept_risk writes an `aud_` record.

## Assumptions & open decisions
- ASSUMPTION: distinct-approver rule mirrors CTR-CAP-001 dual control for privileged decisions.
- No Dxx decision directly affects authorization.
