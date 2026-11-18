# PS-148-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-01.R01 | Every figure stores its `metric_key`, `value`, `suppressed` flag, `methodology_version` and `source_job_id`. | MVP |
| PS-148-01.R02 | Figures are integers or rounded to the nearest 10 when `value` ≥ 1,000 (ASSUMPTION). | MVP |
| PS-148-01.R03 | Published reports are immutable; a correction is a new version with `supersedes`. | MVP |
| PS-148-01.R04 | `max_data_class` is `PUBLIC`; no case IDs, user IDs or free text. | MVP |

## Data / schema
`transparency_report`: `report_id` (entity ID, prefix PENDING CTR-ID-001), `period_start`, `period_end` (dates), `status` (`draft`, `approved`, `published`), `version`, `revision`, `supersedes` (report_id or null), `figures[]`, `published_at`.

`figure`: `metric_key` (enum: `listings_restricted`, `listings_prohibited`, `appeals_received`, `appeals_upheld`, `governance_decisions`), `dimension` (`none` or `region` with coarse code), `value` (integer ≥ 0 or null when suppressed), `suppressed` (boolean), `source_job_id`.

`methodology`: `methodology_version` (semver), `text_hash`, `approved_by` (`acc_`), `effective_from`.

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-148-01-01 (unit): a figure below the threshold with suppressed = false is rejected.
- TEST-PS-148-01-02 (schema): supersedes must reference a published report.

## Acceptance criteria
1. TEST-PS-148-01-01, TEST-PS-148-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

