# PS-144-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-03.R01 | Category states are exactly `proposed`, `published`, `deprecated`. | MVP |
| PS-144-03.R02 | Only `published` categories can be selected on new listings. | MVP |
| PS-144-03.R03 | `deprecated` categories remain valid for existing listings until migration completes. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | ProposeGoodsCategory | R01–R02 pass | proposed | emit `goods_category.proposed` |
| proposed | PublishGoodsCategory | Governance approval ID present | published | new taxonomy_version; emit `goods_category.published` |
| proposed | RejectProposal | none | (removed, key not reusable) | none |
| published | DeprecateGoodsCategory | `replaced_by_key` published | deprecated | emit `goods_category.deprecated` |
| deprecated | RetireCategory | no open listing uses it | retired | key retired (R04) |

## Validation & errors
Invalid pairs return `GOODS.INVALID_TRANSITION` (422). Published records are never edited in place.

## Failure, idempotency, concurrency, offline
- Duplicate publish of the same version returns the existing version.
- Deprecation during active listings: migration job moves listings with a `listing.category_migrated` event (F01 owner) before retirement.
- Offline: no effect; taxonomy is read from the published version.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-144-03-01 (unit): every row of the transition table passes; other pairs return GOODS.INVALID_TRANSITION.
- TEST-PS-144-03-02 (integration): a deprecated category stays valid for existing listings until migration completes.

## Acceptance criteria
1. TEST-PS-144-03-01, TEST-PS-144-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: a category with open listings cannot be retired.
- No Dxx decision applies directly: PROVISIONAL, none applied.
