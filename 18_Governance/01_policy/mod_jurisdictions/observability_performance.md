# PS-145-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-08.R01 | Lookup count per region and category per day; no user IDs in metrics. | MVP |
| PS-145-08.R02 | Alert when any restricted-category submission fails closed more than 5 times in 10 minutes (ASSUMPTION). | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Rule lookup, p95 | ≤ 50 ms (cached) |
| Publish visible to listing service, p95 | ≤ 60 s |

## Logs
Region code, rule key, version, outcome. No listing text or user identifiers.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal targets only.
- D05 default applies to metrics granularity: PROVISIONAL (D05 default, unapproved).
