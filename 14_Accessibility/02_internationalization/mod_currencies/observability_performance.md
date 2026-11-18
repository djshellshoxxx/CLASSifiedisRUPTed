# PS-112-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-08.R01 | Count format errors and fallback uses by error code. | MVP |
| PS-112-08.R02 | Format p95 ≤ 2 ms per amount on reference device (ASSUMPTION). | MVP |
| PS-112-08.R03 | Logs carry codes and versions only. | MVP |

## Data / schema
Metrics: `cur_format_error_total{code}`, `cur_catalog_version` gauge, `cur_format_ms` histogram.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Labels from CTR-ERR-001 codes.

## Authorization
Engineering roles read metrics.

## Failure, idempotency, concurrency, offline
Metrics buffered offline and dropped after 24 h.

## Privacy, retention, abuse
No amounts or codes tied to accounts in metrics.

## Observability & budgets
| Budget | Target |
|---|---|
| Format p95 | ≤ 2 ms per amount |
| Catalog fetch p95 | ≤ 100 ms |

## Tests
- TEST-PS-112-08-01 performance: 1000 amounts formatted in a benchmark run.
- TEST-PS-112-08-02 static: metric labels are enums.

## Acceptance criteria
1. Budgets met in test run.
2. Catalog version gauge matches served version.

## Assumptions & open decisions
- ASSUMPTION: reference device defined at implementation.
- No Dxx decision directly affects observability.
