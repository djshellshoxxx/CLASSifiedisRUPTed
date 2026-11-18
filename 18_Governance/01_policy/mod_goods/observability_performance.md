# PS-144-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-08.R01 | Count of listings per category and per deprecated key is reported daily. | MVP |
| PS-144-08.R02 | Taxonomy read latency is measured per version. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Taxonomy fetch, p95 | ≤ 100 ms (cached) |
| Publish to visible, p95 | ≤ 60 s |
| Listings on deprecated keys after migration deadline | 0 |

## Logs
Category key, version, outcome. No listing content.

## Assumptions & open decisions
- ASSUMPTION: deprecated-key migration deadline is 90 days.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
