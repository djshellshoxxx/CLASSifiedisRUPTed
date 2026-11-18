# PS-123-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-03.R01 | Lifecycle is `draft` → `active` → `deprecated` → `retired`; no other transitions. | MVP |
| PS-123-03.R02 | Only `active` features can be enabled by PS-124 flags. | MVP |
| PS-123-03.R03 | `deprecated` features keep existing flag values but refuse new enablement. | MVP |
| PS-123-03.R04 | `retired` removes the feature from evaluation after its flags are set to off. | MVP |

## Data / schema
`lifecycle` field. Events: `feature.defined`, `feature.activated`, `feature.deprecated`, `feature.retired` (CTR-EVT-001, aggregate `feature`).

## Commands / queries / events
`feature.define`, `feature.activate`, `feature.deprecate`, `feature.retire` (PS-123-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | define | PS-123-02 passes | draft | emit `feature.defined` |
| draft | activate | owner module contract test passes; D refs recorded | active | emit `feature.activated` |
| active | deprecate | no dependent `active` feature requires it | deprecated | emit `feature.deprecated`; flags set off within 24 h |
| deprecated | retire | 30 days elapsed; all flags off | retired | emit `feature.retired`; slug reserved forever |
| active | retire | refused (must deprecate first) | — | `FEATURE.DEPENDENCY_UNMET` |

## Validation & errors
Invalid transitions return `SYS.CONFLICT`.

## Authorization
Activate and retire need `feature.administer` with two `ope` approvers (PS-123-05).

## Failure, idempotency, concurrency, offline
Transitions idempotent on (`slug`, from, to). Revision check on the feature aggregate.

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Metric: `feature_lifecycle_transitions_total{from,to}`.

## Tests
- TEST-PS-123-03-01 (unit): transition table; illegal transitions refused.
- TEST-PS-123-03-02 (integration): deprecation turns flags off within 24 h.
- TEST-PS-123-03-03 (lint): retired slug cannot be redefined.
- TEST-PS-123-03-04 (integration): retire of a required feature refused.

## Acceptance criteria
1. Lifecycle table enforced (TEST-01).
2. TEST-PS-123-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 30-day deprecation window.
