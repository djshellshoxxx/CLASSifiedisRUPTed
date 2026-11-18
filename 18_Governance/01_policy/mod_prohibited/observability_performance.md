# PS-146-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-08.R01 | Count of decisions per outcome, per class, per region per day; no user IDs. | MVP |
| PS-146-08.R02 | Track false-positive rate from appeals per class monthly. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Classification latency, p95 | ≤ 150 ms |
| Appeal-overturned rate per class | flagged to F12 above 10% in a month |
| Fail-closed events | alert if > 5 per 10 minutes |

## Logs
Decision ID, outcome, rule keys and version, region code. No listing content.

## Assumptions & open decisions
- ASSUMPTION: targets are internal.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
