# PS-009-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-09.R01 | Every requirement in PS-009-01 to -08 maps to at least one TEST-PS-009-* ID. | MVP |
| PS-009-09.R02 | Contract tests run against CTR-EVT-001, CTR-ERR-001, CTR-CAP-001 and CTR-SCH-001 fixtures on each build. | MVP |
| PS-009-09.R03 | Accessibility tests cover keyboard add/archive and screen-reader announcement of each variant label. | MVP |

## Data / schema
Fixtures: listings with 0, 1, 25 and 26 variants; key/value boundary sets; PII-like strings; offline queue snapshots.

## Commands / queries / events
Test harness calls PS-009-04 commands only; no direct store writes.

## States & transitions
Every row of PS-009-03 has a test.

## Validation & errors
Every `VARIANT.*` code has a negative test (PS-009-02).

## Authorization
Every row of PS-009-05 has a test.

## Failure, idempotency, concurrency, offline
Concurrency, race and offline tests per PS-009-06.

## Privacy, retention, abuse
Lint and PII tests per PS-009-07.

## Observability & budgets
Metric-name and log-scan tests per PS-009-08.

## Tests
| Test ID | Layer | Scope |
|---|---|---|
| TEST-PS-009-01-01..03 | unit, property, contract | schema limits and normalisation |
| TEST-PS-009-02-01..03 | unit, property, negative | error codes and PII |
| TEST-PS-009-03-01..03 | unit, integration, property | state table |
| TEST-PS-009-04-01..03 | contract, unit | events and idempotency |
| TEST-PS-009-05-01..03 | unit, integration, negative | authorization |
| TEST-PS-009-06-01..03 | concurrency, integration, offline | races and queue |
| TEST-PS-009-07-01..03 | negative, integration, abuse | privacy and rate |
| TEST-PS-009-08-01..03 | unit, load, negative | metrics and budgets |
| TEST-PS-009-09-01 | e2e | seller adds three variants; buyer sees three; archive hides one |
| TEST-PS-009-09-02 | a11y | keyboard-only add and archive; labels announced in full |

## Acceptance criteria
1. Every TEST ID above passes in CI before merge (at implementation).
2. End-to-end flow: seller adds 3 variants, buyer lists 3, one archived, buyer lists 2.
3. Accessibility test reports zero critical findings on the variant picker.

## Assumptions & open decisions
- ASSUMPTION: test fixtures are synthetic; no real personal data is used.
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.
