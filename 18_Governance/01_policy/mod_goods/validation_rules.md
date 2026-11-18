# PS-144-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-02.R01 | Reject a category whose parent is missing, creates a cycle or exceeds depth 6. | MVP |
| PS-144-02.R02 | Reject a restriction flag without `rule_refs`, and a `rule_refs` entry that does not resolve. | MVP |
| PS-144-02.R03 | Reject a `deprecated` category without `replaced_by_key` that is `published`. | MVP |
| PS-144-02.R04 | Reject a `category_key` that duplicates a retired key. | MVP |

## Validation and errors
| Code | Retryable | Category / HTTP | Message key | Privacy-safe diagnostic |
|---|---|---|---|---|
| GOODS.PARENT_INVALID | false | validation / 400 | err.goods.parent_invalid | parent key |
| GOODS.CYCLE_OR_DEPTH | false | validation / 400 | err.goods.cycle_or_depth | depth value |
| GOODS.RULE_REF_UNRESOLVED | false | precondition_failed / 412 | err.goods.rule_ref_unresolved | rule ID |
| GOODS.KEY_RETIRED | false | conflict / 409 | err.goods.key_retired | category key |
| GOODS.INVALID_TRANSITION | false | unprocessable_state / 422 | err.goods.invalid_transition | from and event names |
| SYS.CONFLICT | false | conflict / 409 | err.sys.conflict | revision mismatch |

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-144-02-01 (unit): each GOODS code fires on its fixture.
- TEST-PS-144-02-02 (unit): a deprecated category without a published replacement is rejected.

## Acceptance criteria
1. TEST-PS-144-02-01, TEST-PS-144-02-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: depth limit 6 is a default; confirm with F01 Marketplace Lead.
- No Dxx decision governs taxonomy validation: PROVISIONAL, none applied.
