# PS-144-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-144-04.R02 | Commands are `v1`; breaking changes need a new name. | MVP |
| PS-144-04.R03 | Queries return published versions by default; `proposed` is visible only to policy roles. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| ProposeGoodsCategory | `(category: goods_category)` | `category_key` + `proposal_hash` | `goods_category.proposed` | GOODS.PARENT_INVALID, GOODS.CYCLE_OR_DEPTH, GOODS.KEY_RETIRED |
| PublishGoodsCategory | `(category_key, governance_approval_id, expected_revision)` | `category_key` + `taxonomy_version` | `goods_category.published` | GOODS.RULE_REF_UNRESOLVED, SYS.CONFLICT, SYS.FORBIDDEN |
| DeprecateGoodsCategory | `(category_key, replaced_by_key, expected_revision)` | `category_key` + `replaced_by_key` | `goods_category.deprecated` | GOODS.INVALID_TRANSITION, GOODS.PARENT_INVALID |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetGoodsTaxonomyVersion | `version?` | category tree for version | SYS.NOT_FOUND |
| ListGoodsCategories | `status?`, cursor, limit ≤ 100 | category summaries | SYS.REQUEST_MALFORMED |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| goods_category.proposed | goods_category | PUBLIC | category_key, parent_key |
| goods_category.published | goods_category | PUBLIC | category_key, taxonomy_version |
| goods_category.deprecated | goods_category | PUBLIC | category_key, replaced_by_key |

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
- TEST-PS-144-04-01 (contract): PublishGoodsCategory is idempotent on (category_key, taxonomy_version).
- TEST-PS-144-04-02 (contract): goods events validate against the CTR-EVT-001 envelope schema.

## Acceptance criteria
1. TEST-PS-144-04-01, TEST-PS-144-04-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: F01 subscribes to published and deprecated events.
- No Dxx applies directly: PROVISIONAL, none applied.
