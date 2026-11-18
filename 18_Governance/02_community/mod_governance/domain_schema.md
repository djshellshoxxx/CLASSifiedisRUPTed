# PS-147-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-01.R01 | Each proposal targets one rule key and one base rule version. | MVP |
| PS-147-01.R02 | A decision records the proposal's final text hash (SHA-256) and the approver `acc_` IDs. | MVP |
| PS-147-01.R03 | Each approval ID is single-use and bound to one target change. | MVP |
| PS-147-01.R04 | `max_data_class` is `PUBLIC` for rules and decisions; vote records are `PSEUDONYMOUS`. | MVP |

## Data / schema
`community_rule`: `rule_key` (`^CR-[A-Z0-9]{2,12}$`), `version` (semver), `text_hash`, `published_at`, `effective_from`, `superseded_by`.

`governance_proposal`: `proposal_id` (entity ID, prefix PENDING CTR-ID-001), `target_rule_key`, `base_version`, `proposed_text_hash`, `reason_key`, `proposed_by` (`acc_`), `status` (`open`, `decided`, `withdrawn`), `opened_at`, `closes_at`.

`governance_decision`: `decision_id`, `proposal_id`, `outcome` (`approved`, `rejected`), `approver_refs` (array of `acc_`), `approval_id` (single-use, returned to the caller), `decided_at`.

Vote records (Future): `proposal_id`, `voter_ref` (`acc_`), `choice`; visibility per PS-147-07.
