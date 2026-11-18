# PS-072-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R07, RET-EVD), CTR-COM-001 (Privacy), CTR-FED-001 (R03). **Decisions:** D06, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-07.R01 | Findings carry claim IDs and codes; amounts and party IDs are not stored in findings. | MVP |
| PS-072-07.R02 | Operator dashboards show counts by type; claim-level views need a case grant. | MVP |
| PS-072-07.R03 | Findings retained with their claim under RET-EVD. | MVP |
| PS-072-07.R04 | Reconciliation output is never federated or exported to third parties. | MVP |
| PS-072-07.R05 | Repeated `FINAL_WITHOUT_ADAPTER` on one operator's resolutions raises a review alert (abuse of dismissal). | MVP |

## Data / schema
Data classes per PS-072-01.

## Commands / queries / events
No event payload contains amounts.

## States & transitions
Finding retention: `open` → `resolved` → purged with claim.

## Validation & errors
No separate codes.

## Authorization
Per PS-072-05.

## Failure, idempotency, concurrency, offline
Purge idempotent.

## Privacy, retention, abuse
- Operator misuse: dismissal requires case reference and dual control; R05 alert.
- Findings must not become a list of who transacts with whom: graph outputs are not produced.
- Pseudonymous IDs are not anonymous.

## Observability & budgets
Counts by type only; no per-operator labels except in R05 alert.

## Tests
- TEST-PS-072-07-01 (lint): finding payload has no amount or party field.
- TEST-PS-072-07-02 (contract): no federation of findings.
- TEST-PS-072-07-03 (integration): R05 alert fires on fixture.
- TEST-PS-072-07-04 (integration): purge with claim.

## Acceptance criteria
1. No amounts in findings.
2. Dismissal misuse alert tested.
3. Purge tied to claim retention.

## Assumptions & open decisions
- ASSUMPTION: R05 threshold of 5 dismissals per operator per 30 days.
- D06, D07 (PROVISIONAL, unapproved).
