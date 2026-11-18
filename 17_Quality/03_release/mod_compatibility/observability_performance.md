# PS-142-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-08.R01 | Each matrix cell shows its last result date and outcome on the release dashboard. | MVP |
| PS-142-08.R02 | Cells without a result in 14 days are highlighted as stale. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Full MVP matrix run time | ≤ 6 h |
| Result visible after recording | ≤ 30 s, p95 |
| Cells with `not_run` on a release candidate | 0 for supported rows |

## Logs
Allowlist: matrix key, row key, outcome, commit SHA prefix. No device identifiers.

## Assumptions & open decisions
- ASSUMPTION: the MVP matrix has up to 40 rows.
- No Dxx governs these budgets directly: D01 applies to peer-protocol rows only: PROVISIONAL (D01 default, unapproved).
