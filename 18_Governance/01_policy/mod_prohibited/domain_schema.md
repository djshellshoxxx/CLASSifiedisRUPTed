# PS-146-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-01.R01 | Each rule names one class, one `effect` (`permitted`, `restricted`, `prohibited`) and at least one reason key. | MVP |
| PS-146-01.R02 | Rule records contain no detection patterns, keywords or regular expressions. | MVP |
| PS-146-01.R03 | A classification decision stores rule IDs, outcome and reason keys only; it stores no listing text or images. | MVP |
| PS-146-01.R04 | `max_data_class` is `PUBLIC` for rules and `PSEUDONYMOUS` for decisions (linked to `acc_` by ID only). | MVP |

## Data / schema
`prohibition_rule`:
- `rule_key`: string, `^PR-[A-Z0-9]{3,8}$`, immutable.
- `class_key`: string; `goods_category_keys`: array from mod_goods.
- `effect`: enum `permitted`, `restricted`, `prohibited`.
- `reason_keys`: array of message keys (no free text).
- `jurisdiction_rule_refs`: array of JR IDs from mod_jurisdictions.
- `source_ref`, `approved_by`, `version`, `retired_at`.

`classification_decision`:
- `decision_id`: entity ID (prefix PENDING CTR-ID-001).
- `draft_ref`: opaque listing draft ID (`PENDING` prefix); `actor_ref`: `acc_`.
- `region_code`: coarse code (see mod_jurisdictions).
- `outcome`: enum `permitted`, `restricted`, `prohibited`.
- `rule_versions`: array of `{rule_key, version}`.
- `case_ref`: `cas_` ID or null. `decided_at`.

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
- TEST-PS-146-01-01 (unit): a rule containing a regular expression is rejected.
- TEST-PS-146-01-02 (schema): a classification_decision has no free-text field.

## Acceptance criteria
1. TEST-PS-146-01-01, TEST-PS-146-01-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

