# PS-148-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-06.R01 | Publish is atomic: the report and all its figures become visible together or not at all. | MVP |
| PS-148-06.R02 | Drafting reads aggregate jobs only after they report `complete`; partial job output is not used. | MVP |
| PS-148-06.R03 | A failed draft leaves no partial figures visible to any reader. | MVP |

## Failure, idempotency, concurrency, offline
- **Aggregate job re-run with different results:** the draft keeps the first `source_job_id` values; re-drafting creates a new revision and shows the diff to the approver.
- **Concurrent approvals:** `expected_revision`; loser gets `SYS.CONFLICT`.
- **Correction after publish:** new report with `supersedes`; the old version stays readable and marked superseded.

## Tests
- TEST-PS-148-06-01 (integration): aggregate job incomplete → draft blocked; no figures visible.
- TEST-PS-148-06-02 (integration): publish interrupted → nothing visible; retry publishes once.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Acceptance criteria
1. the tests above pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: superseded reports remain public.
- D07 default applies to drafts: PROVISIONAL (D07 default, unapproved).
