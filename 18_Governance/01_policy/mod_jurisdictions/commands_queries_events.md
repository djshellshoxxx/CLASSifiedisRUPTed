# PS-145-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-145-04.R02 | Commands are `v1`. | MVP |
| PS-145-04.R03 | Queries are filtered by region and date; a query never returns a user's region. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| ProposeJurisdictionRule | `(rule: jurisdiction_rule)` | `rule_key` + `version` | `jurisdiction_rule.proposed` | JURIS.REGION_UNKNOWN, JURIS.SOURCE_MISSING, JURIS.DATE_RANGE_INVALID |
| PublishJurisdictionRule | `(rule_key, version, approver_ref, expected_revision)` | `rule_key` + `version` | `jurisdiction_rule.published` | JURIS.PROHIBITION_LINK_MISSING, SYS.FORBIDDEN, SYS.CONFLICT |
| WithdrawJurisdictionRule | `(rule_key, version, reason_key, expected_revision)` | `rule_key` + `version` + `reason_key` | `jurisdiction_rule.withdrawn` | JURIS.INVALID_TRANSITION, SYS.CONFLICT |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetJurisdictionRules | `region_code`, `as_of` date, `listing_type` | applicable rule versions | JURIS.REGION_UNKNOWN |
| ListJurisdictionRuleVersions | `rule_key`, cursor | version history | SYS.NOT_FOUND |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| jurisdiction_rule.proposed | jurisdiction_rule | PUBLIC | rule_key, version |
| jurisdiction_rule.published | jurisdiction_rule | PUBLIC | rule_key, version, region_code |
| jurisdiction_rule.withdrawn | jurisdiction_rule | PUBLIC | rule_key, version |

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

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
- TEST-PS-145-04-01 (contract): PublishJurisdictionRule is idempotent on (rule_key, version).
- TEST-PS-145-04-02 (contract): jurisdiction events validate against the CTR-EVT-001 envelope schema.

## Acceptance criteria
1. TEST-PS-145-04-01, TEST-PS-145-04-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: F01 and mod_prohibited subscribe to published and withdrawn events.
- D05 default governs region arguments: PROVISIONAL (D05 default, unapproved).
