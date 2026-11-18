# PS-074-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_precision (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Observability section), CTR-PRV-001 (R09), CTR-ERR-001 (R10). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-074-08.R01 | Conversion (`convert_minor`) p99 ≤ 50 µs and parse (`parse_amount`) p99 ≤ 5 µs on the reference benchmark (ASSUMPTION). | MVP |
| PS-074-08.R02 | Callers emit counters labelled by `PREC.*` code and by stage name only; no amount, rate or currency value in labels. | MVP |
| PS-074-08.R03 | Alert: any `PREC.INTERNAL` in production (target 0). Any `PREC.OVERFLOW` on a claim path pages the Commerce Lead. | MVP |
| PS-074-08.R04 | Benchmark run on every release; a regression above 20% against the previous release blocks the release (ASSUMPTION). | MVP |
| PS-074-08.R05 | The library writes no log lines. Callers log the error code and request ID only (CTR-ERR-001 R10). | MVP |

## Data / schema
Benchmark dataset: synthetic inputs spanning 1 to 39 digits, exponents 0 to 18, and rate scales 0 to 18. Results stored as JSON with library version and hardware profile.

## Commands / queries / events
Not applicable at library level.

## States & transitions
Not applicable.

## Validation & errors
Counter by `PREC.*` code in callers. Validation errors are counted, never sampled away.

## Authorization
Benchmark dashboards are visible to the Commerce Lead and the platform team; they contain no user data.

## Failure, idempotency, concurrency, offline
Benchmarks are deterministic under fixed inputs. Panic or internal error counted as `PREC.INTERNAL`.

## Privacy, retention, abuse
Benchmark datasets are synthetic and retained 365 days (ASSUMPTION). Production counters are retained 90 days.

## Observability & budgets
- Parse and conversion budgets as R01.
- Memory: no allocation growth per call beyond the 39-digit working set (ASSUMPTION; measured).
- Throughput: 100,000 conversions per second per core on the reference profile (ASSUMPTION).

## Tests
- TEST-PS-074-08-01 (benchmark): R01 budgets in CI on the reference profile.
- TEST-PS-074-08-02 (integration): synthetic internal error increments `PREC.INTERNAL` and triggers alert.
- TEST-PS-074-08-03 (unit): library emits no log output during the full vector suite (stdout and stderr captured).
- TEST-PS-074-08-04 (benchmark): regression gate blocks a release with a 25% slower conversion.

## Acceptance criteria
1. R01 budgets met on the reference profile.
2. No log output from the library.
3. Regression gate and must-be-zero alert tested in staging.

## Assumptions & open decisions
- ASSUMPTION: reference hardware profile defined by F15.
- D03 (PROVISIONAL default, unapproved).
