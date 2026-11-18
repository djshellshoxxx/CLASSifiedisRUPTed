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

## Assumptions & open decisions
- ASSUMPTION: F01 subscribes to published and deprecated events.
- No Dxx applies directly: PROVISIONAL, none applied.
