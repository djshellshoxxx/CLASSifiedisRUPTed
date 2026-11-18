# PS-148-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-05.R01 | Default deny per CTR-CAP-001 R01. | MVP |
| PS-148-05.R02 | Drafting needs `transp.report.draft`; approving and publishing need `transp.report.approve`, held by a different principal. | MVP |
| PS-148-05.R03 | Reading draft figures needs `transp.report.read_draft` at global scope and is logged as a privileged read (CTR-CAP-001 R08). | MVP |
| PS-148-05.R04 | No principal can read case-level data through this module. | MVP |

## Authorization
| Actor (principal) | Action | Scope | Decision |
|---|---|---|---|
| Analyst `acc_` with `transp.report.draft` | transparency_report.create | global | ALLOW |
| Approver `acc_` with `transp.report.approve` | transparency_report.accept, publish | global | ALLOW if not drafter |
| Reviewer `acc_` with `transp.report.read_draft` | transparency_report.read (draft) | global | ALLOW, audit record emitted |
| Public | transparency_report.read (published) | global | ALLOW |
| Any principal | case-level read | global | DENY |

## Validation & errors
Denied: `SYS.FORBIDDEN`. Hidden drafts: `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Revocation at next decision. No offline path.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-148-05-01 (negative): a drafter approving their own report receives SYS.FORBIDDEN.
- TEST-PS-148-05-02 (negative): a case-level read is denied to every principal.

## Acceptance criteria
1. TEST-PS-148-05-01, TEST-PS-148-05-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: privileged read rules follow CTR-CAP-001 R06 (expiry, purpose); exact values confirmed with F16.
- D10 not affected: PROVISIONAL (D10 default, unapproved).
