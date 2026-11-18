# PS-097-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/02_policy/mod_spam. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-097-09.R01 | Every row of the PS-097-03 table has a test; non-table pairs expect `SPAM.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-097-09.R02 | Contract tests validate commands, events and errors in CI. | MVP |
| PS-097-09.R03 | Labeled evaluation set of at least 2 000 items per locale used for regression (fixture, synthetic or consented; no private messages). | MVP |
| PS-097-09.R04 | Regression gate: a new model version must not reduce recall of confirmed spam by more than 2 points or raise false positives by more than 0.5 points on the labeled set (ASSUMPTION). | MVP |

## Data / schema
Fixtures: synthetic spam and ham listings in each supported locale; synthetic message metadata sequences; canary strings for privacy tests. No real personal data.

## Commands / queries / events
Test IDs `TEST-PS-097-09-nn`.

## States & transitions
All five states and seven rows exercised.

## Validation & errors
Negative corpus covers every code in PS-097-02.

## Authorization
Table-driven suite from PS-097-05.

## Failure, idempotency, concurrency, offline
Fault injection: scorer outage, duplicate evaluations, offline draft.

## Privacy, retention, abuse
Canary and leakage tests from PS-097-07.

## Observability & budgets
Load and alert tests from PS-097-08.

## Tests
- `TEST-PS-097-09-01` unit: transition table exhaustive.
- `TEST-PS-097-09-02` contract: schemas validate; no feature field in events.
- `TEST-PS-097-09-03` regression: model gate R04 on labeled set.
- `TEST-PS-097-09-04` integration: listing hidden until verdict, visible after allow.
- `TEST-PS-097-09-05` e2e: author sees generic under-review state; screen-reader labels; WCAG 2.1 AA (ASSUMPTION scope).
- `TEST-PS-097-09-06` privacy: canary text absent from storage and logs.

## Acceptance criteria
1. 100 % of transitions and codes covered in CI.
2. Regression gate blocks a deliberately degraded model in test.
3. Accessibility tests pass for author notices.

## Assumptions & open decisions
- ASSUMPTION: labeled set construction is owned by F12 with F14 review for locales.
- D05 (geoprivacy), not applicable; listed for completeness that spam features exclude location.
- D08 (PWA offline writes), PROVISIONAL default applies to offline listing drafts (unapproved).
