# PS-073-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, RET-LEGAL), CTR-EVT-001 (R06). **Decisions:** D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-07.R01 | Registry holds no personal data. Lint blocks any field classed above PUBLIC. | MVP |
| PS-073-07.R02 | Registry entries are retained for the life of any claim that references them plus 24 months (ASSUMPTION). | MVP |
| PS-073-07.R03 | Look-alike asset abuse is controlled by PS-073-02 R04. | MVP |

## Data / schema
All fields PUBLIC.

## Commands / queries / events
Events carry registry IDs only.

## States & transitions
Deprecated entries are not deleted.

## Validation & errors
Lint violations fail CI (`PRV.UNCLASSIFIED_FIELD`, `PRV.CLASS_VIOLATION`).

## Authorization
None beyond PS-073-05.

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-073-06.

## Privacy, retention, abuse
- Asset impersonation: flagged by R04 control.
- Registry changes are auditable and do not expose operator identity to the public beyond role (ASSUMPTION).

## Observability & budgets
None beyond counts.

## Tests
- TEST-PS-073-07-01 (lint): no non-PUBLIC field in schema.
- TEST-PS-073-07-02 (integration): entry retained while a claim references it.

## Acceptance criteria
1. Lint passes.
2. Retention rule tested.

## Assumptions & open decisions
- ASSUMPTION: 24-month post-reference retention.
- D07 (PROVISIONAL default, unapproved).
