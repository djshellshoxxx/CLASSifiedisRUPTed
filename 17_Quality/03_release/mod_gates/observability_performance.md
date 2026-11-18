# PS-143-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-08.R01 | Every decision emits a metric with outcome, gate key and blocking evidence type. | MVP |
| PS-143-08.R02 | Open waivers and days to expiry are visible on the release dashboard. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Evaluation time after last evidence arrives, p95 | ≤ 60 s |
| Waivers open past expiry | 0 |
| Blocked decisions older than 7 days without a waiver or fix | flagged to QA Lead |

## Logs
Gate key, commit SHA prefix, outcome, evidence type. No evidence bodies.

## Assumptions & open decisions
- ASSUMPTION: 60-second budget assumes evidence records are already stored.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
