# PS-143-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-01.R01 | Each gate definition lists required evidence types from the set `ci_run`, `offline_run`, `compat_result`, `a11y_audit`, `privacy_review`, `security_review`. | MVP |
| PS-143-01.R02 | Each evidence reference stores the source record ID and its digest; the gate never copies the source body. | MVP |
| PS-143-01.R03 | A waiver has `expires_at` ≤ 14 days after `granted_at` (ASSUMPTION) and a non-empty `reason_key`. | MVP |
| PS-143-01.R04 | `max_data_class` is `PUBLIC`. | MVP |

## Data / schema
`release_gate` (versioned): `gate_key`, `version`, `revision`, `required_evidence[]`, `min_approvals` (integer ≥ 0), `applies_to` enum `release`, `pre_release`.

`gate_decision`: `decision_id` (entity ID; prefix PENDING CTR-ID-001), `gate_key`, `gate_version`, `commit_sha` (40 hex), `outcome` enum `pass`, `blocked`, `waived`, `evidence[]` (`{evidence_type, source_id, digest}`), `evaluated_at`, `evaluator_ref` (`sys_`).

`gate_waiver`: `waiver_id`, `decision_id`, `gate_key`, `requested_by` (`acc_`), `approved_by` (`acc_`, must differ), `reason_key`, `granted_at`, `expires_at`, `revoked_at?`.

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
- TEST-PS-143-01-01 (schema): a waiver without reason_key is rejected.
- TEST-PS-143-01-02 (unit): an evidence reference stores digest and source ID, never the source body.

## Acceptance criteria
1. TEST-PS-143-01-01, TEST-PS-143-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.


## Assumptions & open decisions
- ASSUMPTION: field list is provisional until the module owner review; evidence IDs come from other modules.
- D07 (retention) default applies to decisions: PROVISIONAL (D07 default, unapproved).
