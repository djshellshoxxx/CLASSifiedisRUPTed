# PS-100-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-COM-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-09.R01 | Every row of the PS-100-03 table has a test; non-table pairs expect `RISK.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-100-09.R02 | Contract tests validate commands, events and errors against CTR-SCH-001 and CTR-ERR-001. | MVP |
| PS-100-09.R03 | Model regression and fairness gates run before each model release (labeled set, synthetic only). | MVP |
| PS-100-09.R04 | Integration with F07 step-up, F01 publish, F04 auctions and F02 proposals on contract stubs. | MVP |

## Data / schema
Fixtures: synthetic subjects across six types; synthetic signal sets; claim-status fixtures (claimed only); locale-tagged labeled set. No real personal data.

## Commands / queries / events
Test IDs `TEST-PS-100-09-nn`.

## States & transitions
All seven states and eleven rows exercised.

## Validation & errors
Negative corpus for each code in PS-100-02.

## Authorization
Table-driven suite of PS-100-05 matrix.

## Failure, idempotency, concurrency, offline
Fault injection from PS-100-06.

## Privacy, retention, abuse
Allow-list and fairness tests from PS-100-07.

## Observability & budgets
Load and alert tests from PS-100-08.

## Tests
- `TEST-PS-100-09-01` unit: transition table exhaustive.
- `TEST-PS-100-09-02` contract: schemas validate; subject-facing events omit tier.
- `TEST-PS-100-09-03` regression: model gate on labeled set (recall and false positive thresholds, ASSUMPTION).
- `TEST-PS-100-09-04` fairness: tier share within ±5 points across locales.
- `TEST-PS-100-09-05` integration: critical listing hold removes it from discovery; F01 publish path not blocked.
- `TEST-PS-100-09-06` e2e (keyboard, screen reader): reviewer queue and subject "under review" notice accessible; WCAG 2.1 AA (ASSUMPTION scope).

## Acceptance criteria
1. 100 % of transitions and codes covered in CI.
2. Regression and fairness gates block a degraded model in test.
3. Accessibility tests pass for reviewer and subject screens.

## Assumptions & open decisions
- ASSUMPTION: F07, F01, F02 and F04 contract stubs exist before this suite runs.
- D04 (partial barter execution), PROVISIONAL default applies to cycle-routing tests (unapproved).
- D06 (receipts), PROVISIONAL default applies to receipt-signal tests (unapproved).
