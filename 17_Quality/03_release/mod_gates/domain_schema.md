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
