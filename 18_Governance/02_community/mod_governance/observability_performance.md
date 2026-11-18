# PS-147-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-08.R01 | Count of proposals by status and days-to-decision, reported monthly. | MVP |
| PS-147-08.R02 | Approval IDs unused after 30 days are listed for steward review. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Proposal open or decide response, p95 | ≤ 500 ms |
| Median days to decision | ≤ 14 |

## Logs
Proposal ID, status, rule key, approval ID hash. No reasons beyond keys, no votes.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
